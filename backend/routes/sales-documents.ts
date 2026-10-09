import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";
import { jsonBuildObject } from "kysely/helpers/sqlite";
import { ParseJSONResultsPlugin, sql } from "kysely";

const salesDocumentsRouter = new Hono();

async function checkProductStock(
  items: { product_id: number; quantity: number }[],
  excludeDocumentId?: number,
): Promise<string | null> {
  const requiredByProduct = new Map<number, number>();
  for (const item of items) {
    requiredByProduct.set(
      item.product_id,
      (requiredByProduct.get(item.product_id) || 0) + Number(item.quantity),
    );
  }

  const stockRows = await db
    .selectFrom("product_stock")
    .select([
      "product_id",
      sql<number>`coalesce(sum(case when product_stock.document_id = ${excludeDocumentId ?? -1} then 0 else product_stock.quantity end), 0)`.as("total"),
    ])
    .where("product_id", "in", items.map((item) => item.product_id))
    .groupBy("product_id")
    .execute();

  const available = new Map(
    stockRows.map((row) => [row.product_id, Number(row.total)]),
  );

  for (const [product_id, required] of requiredByProduct) {
    const inStock = available.get(product_id) || 0;
    if (required > inStock) {
      return `Not enough stock for product ${product_id}: available ${inStock}, required ${required}`;
    }
  }

  return null;
}

// GET all sales documents
salesDocumentsRouter.get("/", async (c) => {
  try {
    const documents = await db
      .selectFrom("sales_document")
      .selectAll()
      .execute();
    return c.json({ data: documents, count: documents.length });
  } catch (error) {
    logger.error("Failed to fetch sales documents", error);
    return c.json({ error: "Failed to fetch sales documents" }, 500);
  }
});

// GET sales document by ID with items
salesDocumentsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const document = await db
      .selectFrom("sales_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Sales document not found" }, 404);
    }

    const items = await db
      .selectFrom("sales_document_item")
      .leftJoin("product", "product.id", "sales_document_item.product_id")
      .select((eb) => [
        "sales_document_item.id",
        "sales_document_item.quantity",
        "sales_document_item.price",
        "sales_document_item.product_id",
        jsonBuildObject({
          article: eb.ref("product.article"),
          name: eb.ref("product.name"),
        }).as("product"),
      ])
      .where("document_id", "=", id)
      .withPlugin(new ParseJSONResultsPlugin())
      .execute();

    return c.json({ data: { ...document, items } });
  } catch (error) {
    logger.error("Failed to fetch sales document", error);
    return c.json({ error: "Failed to fetch sales document" }, 500);
  }
});

// POST create sales document
salesDocumentsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { date, partner_id, items } = body;

    if (!partner_id) {
      return c.json({ error: "Partner ID is required" }, 400);
    }

    const documentId = await db.transaction().execute(async (trx) => {
      const result = await trx
        .insertInto("sales_document")
        .values({
          date: date || new Date().toISOString(),
          partner_id,
          posted: 0,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      const documentId = result.id;

      if (items && items.length > 0) {
        await trx
          .insertInto("sales_document_item")
          .values(
            items.map((item: any) => ({
              document_id: documentId,
              product_id: item.product_id,
              price: item.price,
              quantity: item.quantity,
            })),
          )
          .execute();
      }

      return documentId;
    });

    return c.json(
      { data: { id: documentId, date, partner_id, posted: false, items } },
      201,
    );
  } catch (error) {
    logger.error("Failed to create sales document", error);
    return c.json({ error: "Failed to create sales document" }, 500);
  }
});

// POST endpoint to post/finalize sales document (creates stock records)
salesDocumentsRouter.post("/:id/post", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Get the document
    const document = await db
      .selectFrom("sales_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (!document) {
      return c.json({ error: "Sales document not found" }, 404);
    }

    if (document.posted) {
      return c.json({
        data: { id, posted: true },
        message: "Sales document posted successfully",
      });
    }

    if (!document.date) {
      throw new Error("Cant post document without date");
    }

    const items = await db
      .selectFrom("sales_document_item")
      .selectAll()
      .where("document_id", "=", id)
      .execute();

    if (!items.length) {
      throw new Error("Cant post document without items");
    }

    const stockError = await checkProductStock(items);
    if (stockError) {
      return c.json({ error: stockError }, 400);
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("product_stock")
        .values(
          items.map((item) => ({
            product_id: item.product_id,
            quantity: -item.quantity,
            timestamp: document.date as string,
            document_id: document.id,
          })),
        )
        .execute();

      await trx
        .updateTable("sales_document")
        .set({ posted: 1 })
        .where("id", "=", id)
        .executeTakeFirst();
    });

    return c.json({
      data: { id, posted: true },
      message: "Sales document posted successfully",
    });
  } catch (error) {
    logger.error("Failed to post sales document", error);
    return c.json({ error: "Failed to post sales document" }, 500);
  }
});

// DELETE endpoint to unpost sales document (removes stock records)
salesDocumentsRouter.post("/:id/unpost", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Get the document
    const document = await db
      .selectFrom("sales_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Sales document not found" }, 404);
    }

    if (!document.posted) {
      return c.json({
        data: { id, posted: false },
        message: "Sales document unposted successfully",
      });
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("product_stock")
        .where("document_id", "=", document.id)
        .execute();

      await trx
        .updateTable("sales_document")
        .set({ posted: 0 })
        .where("id", "=", id)
        .execute();
    });

    return c.json({
      data: { id, posted: false },
      message: "Sales document unposted successfully",
    });
  } catch (error) {
    logger.error("Failed to unpost sales document", error);
    return c.json({ error: "Failed to unpost sales document" }, 500);
  }
});

// PUT update sales document
salesDocumentsRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { date, partner_id, items } = body;

    const document = await db
      .selectFrom("sales_document")
      .select(["posted", "date"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (document.posted && !items?.length) {
      throw new Error("Cant save posted document without items");
    }

    if (document.posted && items?.length) {
      const stockError = await checkProductStock(items, id);
      if (stockError) {
        return c.json({ error: stockError }, 400);
      }
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("sales_document")
        .set({ date, partner_id })
        .where("id", "=", id)
        .executeTakeFirst();

      if (document.posted) {
        await trx
          .deleteFrom("product_stock")
          .where("document_id", "=", id)
          .where("quantity", "<", 0)
          .executeTakeFirst();
      }

      await trx
        .deleteFrom("sales_document_item")
        .where("document_id", "=", id)
        .executeTakeFirst();

      if (items?.length) {
        await trx
          .insertInto("sales_document_item")
          .values(
            items.map(
              (item: { product_id: number; quantity: number; price: number }) => ({
                document_id: id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
              }),
            ),
          )
          .executeTakeFirst();
      }

      if (document.posted && items?.length) {
        await trx
          .insertInto("product_stock")
          .values(
            items.map(
              (item: { product_id: number; quantity: number; price: number }) => ({
                document_id: id,
                product_id: item.product_id,
                quantity: -item.quantity,
                timestamp: document.date as string,
              }),
            ),
          )
          .executeTakeFirst();
      }
    });

    return c.json({ data: { id, date, partner_id } });
  } catch (error) {
    logger.error("Failed to update sales document", error);
    return c.json({ error: "Failed to update sales document" }, 500);
  }
});

// DELETE sales document
salesDocumentsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Delete items first
    await db
      .deleteFrom("sales_document_item")
      .where("document_id", "=", id)
      .execute();

    // Delete document
    await db
      .deleteFrom("sales_document")
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id }, message: "Sales document deleted" });
  } catch (error) {
    logger.error("Failed to delete sales document", error);
    return c.json({ error: "Failed to delete sales document" }, 500);
  }
});

export default salesDocumentsRouter;
