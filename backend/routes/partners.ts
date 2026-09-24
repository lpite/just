import { Hono } from "hono";
import { db } from "../db/db";
import { logger } from "../lib/logger";

const partnersRouter = new Hono();

// GET all partners
partnersRouter.get("/", async (c) => {
  try {
    const partners = await db.selectFrom("partner").selectAll().execute();
    return c.json({ data: partners, count: partners.length });
  } catch (error) {
    logger.error("Failed to fetch partners", error);
    return c.json({ error: "Failed to fetch partners" }, 500);
  }
});

// GET partner by ID
partnersRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const partner = await db
      .selectFrom("partner")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!partner) {
      return c.json({ error: "Partner not found" }, 404);
    }

    return c.json({ data: partner });
  } catch (error) {
    logger.error("Failed to fetch partner", error);
    return c.json({ error: "Failed to fetch partner" }, 500);
  }
});

// POST create partner
partnersRouter.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const result = await db
      .insertInto("partner")
      .values({ name })
      .executeTakeFirstOrThrow();

    return c.json(
      { data: { id: result.numInsertedOrModifiedRows, name } },
      201,
    );
  } catch (error) {
    logger.error("Failed to create partner", error);
    return c.json({ error: "Failed to create partner" }, 500);
  }
});

// PUT update partner
partnersRouter.put("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const { name } = body;

    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    await db
      .updateTable("partner")
      .set({ name })
      .where("id", "=", id)
      .executeTakeFirst();

    return c.json({ data: { id, name } });
  } catch (error) {
    logger.error("Failed to update partner", error);
    return c.json({ error: "Failed to update partner" }, 500);
  }
});

// DELETE partner
partnersRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));

    await db.deleteFrom("partner").where("id", "=", id).executeTakeFirst();

    return c.json({ data: { id }, message: "Partner deleted" });
  } catch (error) {
    logger.error("Failed to delete partner", error);
    return c.json({ error: "Failed to delete partner" }, 500);
  }
});

export default partnersRouter;
