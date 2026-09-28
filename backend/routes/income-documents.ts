import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";
import { jsonBuildObject } from "kysely/helpers/sqlite";
import { ParseJSONResultsPlugin } from "kysely";

const incomeDocumentsRouter = new Hono();

// GET all income documents
incomeDocumentsRouter.get("/", async (c) => {
  try {
    const documents = await db
      .selectFrom("income_document")
      .selectAll()
      .execute();
    return c.json({ data: documents, count: documents.length });
  } catch (error) {
    logger.error("Failed to fetch income documents", error);
    return c.json({ error: "Failed to fetch income documents" }, 500);
  }
});

// GET income document by ID with items
incomeDocumentsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const document = await db
      .selectFrom("income_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Income document not found" }, 404);
    }

    const items = await db
      .selectFrom("income_document_item")
      .leftJoin("product", "product.id", "income_document_item.product_id")
      .select((eb) => [
        "income_document_item.id",
        "income_document_item.quantity",
        "income_document_item.price",
        jsonBuildObject({
          id: eb.ref("product.id"),
          article: eb.ref("product.article"),
          name: eb.ref("product.name"),
        }).as("product"),
      ])
      .where("document_id", "=", id)
      .withPlugin(new ParseJSONResultsPlugin())
      .execute();

    return c.json({ data: { ...document, items } });
  } catch (error) {
    logger.error("Failed to fetch income document", error);
    return c.json({ error: "Failed to fetch income document" }, 500);
  }
});

incomeDocumentsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { date, partner_id, items } = body;

    if (!partner_id) {
      return c.json({ error: "Partner ID is required" }, 400);
    }

    const result = await db
      .insertInto("income_document")
      .values({
        date: date || new Date().toISOString(),
        partner_id,
        posted: 0,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

    const documentId = result.id;

    if (items && items.length > 0) {
      await db
        .insertInto("income_document_item")
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

    return c.json(
      { data: { id: documentId, date, partner_id, posted: false, items } },
      201,
    );
  } catch (error) {
    logger.error("Failed to create income document", error);
    return c.json({ error: "Failed to create income document" }, 500);
  }
});

incomeDocumentsRouter.post("/:id/post", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    const document = await db
      .selectFrom("income_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (document.posted) {
      return c.json({
        data: { id, posted: true },
        message: "Income document posted successfully",
      });
    }

    if (!document.date) {
      throw new Error("Cant post document without date");
    }

    const items = await db
      .selectFrom("income_document_item")
      .selectAll()
      .where("document_id", "=", id)
      .execute();

    if (!items.length) {
      throw new Error("Cant post document without items");
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .insertInto("product_stock")
        .values(
          items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            timestamp: document.date as string,
            document_id: document.id,
          })),
        )
        .execute();

      await trx
        .updateTable("income_document")
        .set({ posted: 1 })
        .where("id", "=", id)
        .executeTakeFirst();
    });

    return c.json({
      data: { id, posted: true },
      message: "Income document posted successfully",
    });
  } catch (error) {
    logger.error("Failed to post income document", error);
    return c.json({ error: "Failed to post income document" }, 500);
  }
});

incomeDocumentsRouter.post("/:id/unpost", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const document = await db
      .selectFrom("income_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (!document.posted) {
      return c.json({
        data: { id, posted: false },
        message: "Income document unposted successfully",
      });
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("product_stock")
        .where("document_id", "=", document.id)
        .where("product_stock.quantity", ">", 0)
        .execute();

      await trx
        .updateTable("income_document")
        .set({ posted: 0 })
        .where("id", "=", id)
        .execute();
    });

    return c.json({
      data: { id, posted: false },
      message: "Income document unposted successfully",
    });
  } catch (error) {
    logger.error("Failed to unpost income document", error);
    return c.json({ error: "Failed to unpost income document" }, 500);
  }
});

incomeDocumentsRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { date, partner_id, items } = body;

    const document = await db
      .selectFrom("income_document")
      .select(["posted", "date"])
      .where("id", "=", id)
      .executeTakeFirstOrThrow();

    if (document.posted && !items.length) {
      throw new Error("Cant save posted document without items");
    }

    await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("income_document")
        .set({ date, partner_id })
        .where("id", "=", id)
        .executeTakeFirst();

      if (document.posted) {
        await trx
          .deleteFrom("product_stock")
          .where("document_id", "=", id)
          .where("quantity", ">", 0)
          .executeTakeFirst();
      }

      await trx
        .deleteFrom("income_document_item")
        .where("document_id", "=", id)
        .executeTakeFirst();

      if (items.length) {
        await trx
          .insertInto("income_document_item")
          .values(
            items.map(
              (item: { product_id: any; quantity: any; price: any }) => ({
                document_id: id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
              }),
            ),
          )
          .executeTakeFirst();
      }

      if (document.posted) {
        await trx
          .insertInto("product_stock")
          .values(
            items.map(
              (item: { product_id: any; quantity: any; price: any }) => ({
                document_id: id,
                product_id: item.product_id,
                quantity: item.quantity,
                timestamp: document.date,
              }),
            ),
          )
          .executeTakeFirst();
      }
    });

    return c.json({ data: { id, date, partner_id } });
  } catch (error) {
    logger.error("Failed to update income document", error);
    return c.json({ error: "Failed to update income document" }, 500);
  }
});

// DELETE income document
incomeDocumentsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Delete items first
    await db
      .deleteFrom("income_document_item")
      .where("document_id", "=", id)
      .execute();

    // Delete document
    await db
      .deleteFrom("income_document")
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id }, message: "Income document deleted" });
  } catch (error) {
    logger.error("Failed to delete income document", error);
    return c.json({ error: "Failed to delete income document" }, 500);
  }
});

export default incomeDocumentsRouter;
