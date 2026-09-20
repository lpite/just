import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";

const productPriceRouter = new Hono();

// GET all product prices
productPriceRouter.get("/", async (c) => {
  try {
    const prices = await db
      .selectFrom("product_price")
      .selectAll()
      .execute();
    return c.json({ data: prices, count: prices.length });
  } catch (error) {
    logger.error("Failed to fetch product prices", error);
    return c.json({ error: "Failed to fetch product prices" }, 500);
  }
});

// GET prices by product ID
productPriceRouter.get("/product/:product_id", async (c) => {
  try {
    const productId = parseInt(c.req.param("product_id"));
    const prices = await db
      .selectFrom("product_price")
      .selectAll()
      .where("product_id", "=", productId)
      .execute();

    if (prices.length === 0) {
      return c.json({ error: "No prices found for this product" }, 404);
    }

    return c.json({ data: prices, count: prices.length });
  } catch (error) {
    logger.error("Failed to fetch product prices", error);
    return c.json({ error: "Failed to fetch product prices" }, 500);
  }
});

// GET price by ID
productPriceRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const price = await db
      .selectFrom("product_price")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!price) {
      return c.json({ error: "Price entry not found" }, 404);
    }

    return c.json({ data: price });
  } catch (error) {
    logger.error("Failed to fetch price entry", error);
    return c.json({ error: "Failed to fetch price entry" }, 500);
  }
});

// POST create price entry
productPriceRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { product_id, price } = body;

    if (!product_id || price === undefined) {
      return c.json(
        { error: "Product ID and price are required" },
        400
      );
    }

    const result = await db
      .insertInto("product_price")
      .values({ product_id, price, timestamp: new Date().toISOString() })
      .executeTakeFirstOrThrow();

    return c.json(
      {
        data: {
          id: result.numInsertedOrModifiedRows,
          product_id,
          price,
          timestamp: new Date().toISOString(),
        },
      },
      201
    );
  } catch (error) {
    logger.error("Failed to create price entry", error);
    return c.json({ error: "Failed to create price entry" }, 500);
  }
});

// PUT update price
productPriceRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { price } = body;

    if (price === undefined) {
      return c.json({ error: "Price is required" }, 400);
    }

    await db
      .updateTable("product_price")
      .set({ price })
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id, price } });
  } catch (error) {
    logger.error("Failed to update price", error);
    return c.json({ error: "Failed to update price" }, 500);
  }
});

// DELETE price entry
productPriceRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await db
      .deleteFrom("product_price")
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id }, message: "Price entry deleted" });
  } catch (error) {
    logger.error("Failed to delete price entry", error);
    return c.json({ error: "Failed to delete price entry" }, 500);
  }
});

export default productPriceRouter;
