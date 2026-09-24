import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";
import { sql } from "kysely";

const productStockRouter = new Hono();

// Helper function to get date string without time
function getDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

// GET all product stock (aggregated by date)
productStockRouter.get("/", async (c) => {
  try {
    const dateParam = c.req.query("date") || getDateString(new Date());

    // Get all products with their total stock for the given date
    const stocks = await db
      .selectFrom("product_stock")
      .select("product_id")
      .select(sql<number>`SUM(quantity)`.as("quantity"))
      .where(sql`DATE(timestamp) <= ${dateParam}`)
      .groupBy("product_id")
      .execute();

    return c.json({
      data: stocks,
      date: dateParam,
      count: stocks.length,
    });
  } catch (error) {
    logger.error("Failed to fetch product stock", error);
    return c.json({ error: "Failed to fetch product stock" }, 500);
  }
});

// GET stock by product ID (aggregated by date)
productStockRouter.get("/product/:product_id", async (c) => {
  try {
    const productId = parseInt(c.req.param("product_id"));
    const dateParam = c.req.query("date") || getDateString(new Date());

    const stock = await db
      .selectFrom("product_stock")
      .select("product_id")
      .select(sql<number>`SUM(quantity)`.as("quantity"))
      .where("product_id", "=", productId)
      .where(sql`DATE(timestamp) <= ${dateParam}`)
      .groupBy("product_id")
      .executeTakeFirst();

    if (!stock) {
      return c.json({
        data: { product_id: productId, quantity: 0 },
        date: dateParam,
      });
    }

    return c.json({
      data: stock,
      date: dateParam,
    });
  } catch (error) {
    logger.error("Failed to fetch product stock", error);
    return c.json({ error: "Failed to fetch product stock" }, 500);
  }
});

// GET all stock history entries (raw records)
productStockRouter.get("/history/all", async (c) => {
  try {
    const stocks = await db.selectFrom("product_stock").selectAll().execute();
    return c.json({ data: stocks, count: stocks.length });
  } catch (error) {
    logger.error("Failed to fetch product stock history", error);
    return c.json({ error: "Failed to fetch product stock history" }, 500);
  }
});

// GET stock history by product ID (raw records)
productStockRouter.get("/history/product/:product_id", async (c) => {
  try {
    const productId = parseInt(c.req.param("product_id"));
    const stocks = await db
      .selectFrom("product_stock")
      .selectAll()
      .where("product_id", "=", productId)
      .execute();

    if (stocks.length === 0) {
      return c.json({ error: "No stock history found for this product" }, 404);
    }

    return c.json({ data: stocks, count: stocks.length });
  } catch (error) {
    logger.error("Failed to fetch product stock history", error);
    return c.json({ error: "Failed to fetch product stock history" }, 500);
  }
});

// GET stock record by ID
productStockRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const stock = await db
      .selectFrom("product_stock")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!stock) {
      return c.json({ error: "Stock entry not found" }, 404);
    }

    return c.json({ data: stock });
  } catch (error) {
    logger.error("Failed to fetch stock entry", error);
    return c.json({ error: "Failed to fetch stock entry" }, 500);
  }
});

// POST create stock entry
productStockRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { product_id, quantity } = body;

    if (!product_id || quantity === undefined) {
      return c.json({ error: "Product ID and quantity are required" }, 400);
    }

    const result = await db
      .insertInto("product_stock")
      .values({ product_id, quantity, timestamp: new Date().toISOString() })
      .executeTakeFirstOrThrow();

    return c.json(
      {
        data: {
          id: result.numInsertedOrModifiedRows,
          product_id,
          quantity,
          timestamp: new Date().toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    logger.error("Failed to create stock entry", error);
    return c.json({ error: "Failed to create stock entry" }, 500);
  }
});

// PUT update stock quantity
productStockRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { quantity } = body;

    if (quantity === undefined) {
      return c.json({ error: "Quantity is required" }, 400);
    }

    await db
      .updateTable("product_stock")
      .set({ quantity })
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id, quantity } });
  } catch (error) {
    logger.error("Failed to update stock", error);
    return c.json({ error: "Failed to update stock" }, 500);
  }
});

// DELETE stock entry
productStockRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await db
      .deleteFrom("product_stock")
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id }, message: "Stock entry deleted" });
  } catch (error) {
    logger.error("Failed to delete stock entry", error);
    return c.json({ error: "Failed to delete stock entry" }, 500);
  }
});

export default productStockRouter;
