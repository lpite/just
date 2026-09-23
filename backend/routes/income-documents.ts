import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";

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
      .selectAll()
      .where("document_id", "=", id)
      .execute();

    return c.json({ data: { ...document, items } });
  } catch (error) {
    logger.error("Failed to fetch income document", error);
    return c.json({ error: "Failed to fetch income document" }, 500);
  }
});

// POST create income document
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
        posted: 0
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
          }))
        )
        .execute();
    }

    return c.json(
      { data: { id: documentId, date, partner_id, posted: false, items } },
      201
    );
  } catch (error) {
    logger.error("Failed to create income document", error);
    return c.json({ error: "Failed to create income document" }, 500);
  }
});

// POST endpoint to post/finalize income document (creates stock records)
incomeDocumentsRouter.post("/:id/post", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Get the document
    const document = await db
      .selectFrom("income_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Income document not found" }, 404);
    }

    // If already posted, skip creation and just return success
    if (!document.posted) {
      // Get document items
      const items = await db
        .selectFrom("income_document_item")
        .selectAll()
        .where("document_id", "=", id)
        .execute();

      // Create product stock records with positive quantity for income
      if (items.length > 0) {
        await db
          .insertInto("product_stock")
          .values(
            items.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity, // Positive for income
              timestamp: new Date().toISOString(),
            }))
          )
          .execute();
      }
    }

    // Mark document as posted
    await db
      .updateTable("income_document")
      .set({ posted: true })
      .where("id", "=", id)
      .execute();

    return c.json({ 
      data: { id, posted: true }, 
      message: "Income document posted successfully" 
    });
  } catch (error) {
    logger.error("Failed to post income document", error);
    return c.json({ error: "Failed to post income document" }, 500);
  }
});

// DELETE endpoint to unpost income document (removes stock records)
incomeDocumentsRouter.delete("/:id/post", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    // Get the document
    const document = await db
      .selectFrom("income_document")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!document) {
      return c.json({ error: "Income document not found" }, 404);
    }

    // If not posted, no need to unpost
    if (document.posted) {
      // Get document items
      const items = await db
        .selectFrom("income_document_item")
        .selectAll()
        .where("document_id", "=", id)
        .execute();

      // Remove product stock records (reverse the transaction)
      if (items.length > 0) {
        // We add negative quantity to reverse the positive quantities
        await db
          .insertInto("product_stock")
          .values(
            items.map((item) => ({
              product_id: item.product_id,
              quantity: -item.quantity, // Negative to reverse the positive
              timestamp: new Date().toISOString(),
            }))
          )
          .execute();
      }
    }

    // Mark document as not posted
    await db
      .updateTable("income_document")
      .set({ posted: false })
      .where("id", "=", id)
      .execute();

    return c.json({ 
      data: { id, posted: false }, 
      message: "Income document unposted successfully" 
    });
  } catch (error) {
    logger.error("Failed to unpost income document", error);
    return c.json({ error: "Failed to unpost income document" }, 500);
  }
});

// PUT update income document
incomeDocumentsRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { date, partner_id } = body;

    await db
      .updateTable("income_document")
      .set({ date, partner_id })
      .where("id", "=", id)
      .executeTakeFirst();

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
