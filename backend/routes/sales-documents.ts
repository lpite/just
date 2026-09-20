import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";

const salesDocumentsRouter = new Hono();

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
      .selectAll()
      .where("document_id", "=", id)
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

    // If already posted, skip creation and just return success
    if (document.posted) {
      await db
        .deleteFrom("product_stock")
        .where("document_id", "=", document.id)
        .execute();
    }

    // Get document items
    const items = await db
      .selectFrom("sales_document_item")
      .selectAll()
      .where("document_id", "=", id)
      .execute();

    // Create product stock records with negative quantity for sales
    if (items.length > 0) {
      await db
        .insertInto("product_stock")
        .values(
          items.map((item) => ({
            product_id: item.product_id,
            quantity: -item.quantity, // Negative for sales
            timestamp: new Date().toISOString(),
            document_id: document?.id,
          })),
        )
        .execute();
    }

    // Mark document as posted
    await db
      .updateTable("sales_document")
      .set({ posted: 1 })
      .where("id", "=", id)
      .execute();

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

    // If not posted, no need to unpost
    if (document.posted) {
      // Get document items
      const items = await db
        .selectFrom("sales_document_item")
        .selectAll()
        .where("document_id", "=", id)
        .execute();

      // Remove product stock records (reverse the transaction)
      if (items.length > 0) {
        // Get all stock records and remove the ones matching this document's items
        // We add positive quantity to reverse the negative quantities
        await db
          .insertInto("product_stock")
          .values(
            items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity, // Positive to reverse the negative
              timestamp: new Date().toISOString(),
            })),
          )
          .execute();
      }
    }

    // Mark document as not posted
    await db
      .updateTable("sales_document")
      .set({ posted: 1 })
      .where("id", "=", id)
      .execute();

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
    const { date, partner_id } = body;

    await db
      .updateTable("sales_document")
      .set({ date, partner_id })
      .where("id", "=", id)
      .executeTakeFirst();

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
