import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";

const priceSettingDocumentsRouter = new Hono();

// GET all price setting documents
priceSettingDocumentsRouter.get("/", async (c) => {
  try {
    const documents = await db
      .selectFrom("price_setting_document")
      .selectAll()
      .execute();
    return c.json({ data: documents, count: documents.length });
  } catch (error) {
    logger.error("Failed to fetch price setting documents", error);
    return c.json({ error: "Failed to fetch price setting documents" }, 500);
  }
});

// GET price setting document by ID with items
priceSettingDocumentsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const document = await db
      .selectFrom("price_setting_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Price setting document not found" }, 404);
    }

    const items = await db
      .selectFrom("price_setting_document_item")
      .selectAll()
      .where("document_id", "=", id)
      .execute();

    return c.json({ data: { ...document, items } });
  } catch (error) {
    logger.error("Failed to fetch price setting document", error);
    return c.json({ error: "Failed to fetch price setting document" }, 500);
  }
});

// POST create price setting document
priceSettingDocumentsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { date, items } = body;

    const result = await db
      .insertInto("price_setting_document")
      .values({
        date: date || new Date().toISOString(),
        posted: 0,
      })
      .executeTakeFirstOrThrow();

    const documentId = result.insertId;

    if (items && items.length > 0) {
      await db
        .insertInto("price_setting_document_item")
        .values(
          items.map((item: any) => ({
            document_id: documentId,
            product_id: item.product_id,
            price: item.price,
          })),
        )
        .execute();
    }

    return c.json(
      { data: { id: documentId, date, posted: false, items } },
      201,
    );
  } catch (error) {
    logger.error("Failed to create price setting document", error);
    return c.json({ error: "Failed to create price setting document" }, 500);
  }
});

// POST endpoint to post/finalize price setting document
priceSettingDocumentsRouter.post("/:id/post", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Get the document
    const document = await db
      .selectFrom("price_setting_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Price setting document not found" }, 404);
    }

    // If already posted, skip creation and just return success
    if (!document.posted) {
      // Get document items
      const items = await db
        .selectFrom("price_setting_document_item")
        .selectAll()
        .where("document_id", "=", id)
        .execute();

      // Create product price records
      if (items.length > 0) {
        await db
          .insertInto("product_price")
          .values(
            items.map((item) => ({
              product_id: item.product_id,
              price: item.price,
              timestamp: new Date().toISOString(),
            })),
          )
          .execute();
      }
    }

    // Mark document as posted
    await db
      .updateTable("price_setting_document")
      .set({ posted: true })
      .where("id", "=", id)
      .execute();

    return c.json({
      data: { id, posted: true },
      message: "Price setting document posted successfully",
    });
  } catch (error) {
    logger.error("Failed to post price setting document", error);
    return c.json({ error: "Failed to post price setting document" }, 500);
  }
});

// DELETE endpoint to unpost price setting document (removes price records)
priceSettingDocumentsRouter.delete("/:id/post", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Get the document
    const document = await db
      .selectFrom("price_setting_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Price setting document not found" }, 404);
    }

    // If not posted, no need to unpost
    if (document.posted) {
      // Get document items
      const items = await db
        .selectFrom("price_setting_document_item")
        .selectAll()
        .where("document_id", "=", id)
        .execute();

      // Remove product price records by deleting the ones created by this document
      if (items.length > 0) {
        for (const item of items) {
          // Get the price record created by this document (most recent one for this product)
          const priceRecord = await db
            .selectFrom("product_price")
            .selectAll()
            .where("product_id", "=", item.product_id)
            .where("price", "=", item.price)
            .orderBy("timestamp", "desc")
            .limit(1)
            .executeTakeFirst();

          if (priceRecord) {
            await db
              .deleteFrom("product_price")
              .where("id", "=", priceRecord.id)
              .execute();
          }
        }
      }
    }

    // Mark document as not posted
    await db
      .updateTable("price_setting_document")
      .set({ posted: false })
      .where("id", "=", id)
      .execute();

    return c.json({
      data: { id, posted: false },
      message: "Price setting document unposted successfully",
    });
  } catch (error) {
    logger.error("Failed to unpost price setting document", error);
    return c.json({ error: "Failed to unpost price setting document" }, 500);
  }
});

// PUT update price setting document
priceSettingDocumentsRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { date } = body;

    await db
      .updateTable("price_setting_document")
      .set({ date })
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id, date } });
  } catch (error) {
    logger.error("Failed to update price setting document", error);
    return c.json({ error: "Failed to update price setting document" }, 500);
  }
});

// DELETE price setting document
priceSettingDocumentsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Delete items first
    await db
      .deleteFrom("price_setting_document_item")
      .where("document_id", "=", id)
      .execute();

    // Delete document
    await db
      .deleteFrom("price_setting_document")
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id }, message: "Price setting document deleted" });
  } catch (error) {
    logger.error("Failed to delete price setting document", error);
    return c.json({ error: "Failed to delete price setting document" }, 500);
  }
});

export default priceSettingDocumentsRouter;
