import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";

const productsRouter = new Hono();

// GET all products
productsRouter.get("/", async (c) => {
  try {
    const products = await db.selectFrom("product").selectAll().execute();
    return c.json({ data: products, count: products.length });
  } catch (error) {
    logger.error("Failed to fetch products", error);
    return c.json({ error: "Failed to fetch products" }, 500);
  }
});

// GET product by ID
productsRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const product = await db
      .selectFrom("product")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    return c.json({ data: product });
  } catch (error) {
    logger.error("Failed to fetch product", error);
    return c.json({ error: "Failed to fetch product" }, 500);
  }
});

// POST create product
productsRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const result = await db
      .insertInto("product")
      .values({ name })
      .returning("id")
      .executeTakeFirstOrThrow();

    return c.json(
      { data: { id: Number(result.id), name:name } },
      201
    );
  } catch (error) {
    logger.error("Failed to create product", error);
    return c.json({ error: "Failed to create product" }, 500);
  }
});

// PUT update product
productsRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    await db
      .updateTable("product")
      .set({ name })
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id, name } });
  } catch (error) {
    logger.error("Failed to update product", error);
    return c.json({ error: "Failed to update product" }, 500);
  }
});

// DELETE product
productsRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await db.deleteFrom("product").where("id", "=", id).executeTakeFirst();

    return c.json({ data: { id }, message: "Product deleted" });
  } catch (error) {
    logger.error("Failed to delete product", error);
    return c.json({ error: "Failed to delete product" }, 500);
  }
});

export default productsRouter;
