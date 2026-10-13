import { Hono } from "hono";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { config } from "../config";
import { db } from "../db/db";
import { logger } from "../lib/logger";

const productPhotosRouter = new Hono();

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

function storageRoot() {
  return path.resolve(config.FILE_STORAGE_PATH);
}

function resolveSafe(relPath: string) {
  const root = storageRoot();
  const filePath = path.resolve(root, relPath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return null;
  }
  return filePath;
}

function parsePhotos(raw: string | null | undefined) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === "string")
      : [];
  } catch {
    return [];
  }
}

function sanitizeFilenamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "");
}

function photoUrl(relPath: string) {
  return `/api/product-photos/file?photo=${encodeURIComponent(relPath)}`;
}

// GET file bytes for a stored photo path
productPhotosRouter.get("/file", async (c) => {
  try {
    const relPath = c.req.query("photo");
    if (!relPath) {
      return c.json({ error: "photo parameter is required" }, 400);
    }

    const absPath = resolveSafe(relPath);
    if (!absPath) {
      return c.text("Not found", 404);
    }

    const data = await readFile(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    logger.error("Failed to serve product photo", error);
    return c.text("Not found", 404);
  }
});

// GET all product_photo records
productPhotosRouter.get("/", async (c) => {
  try {
    const records = await db.selectFrom("product_photo").selectAll().execute();
    return c.json({ data: records, count: records.length });
  } catch (error) {
    logger.error("Failed to fetch product photos", error);
    return c.json({ error: "Failed to fetch product photos" }, 500);
  }
});

// GET photo index for a product (from product.photos)
productPhotosRouter.get("/product/:product_id", async (c) => {
  try {
    const productId = parseInt(c.req.param("product_id"));
    const product = await db
      .selectFrom("product")
      .select(["photos"])
      .where("id", "=", productId)
      .executeTakeFirst();

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    const data = parsePhotos(product.photos).map((photo) => ({
      photo,
      url: photoUrl(photo),
    }));

    return c.json({ data, count: data.length });
  } catch (error) {
    logger.error("Failed to fetch product photo index", error);
    return c.json({ error: "Failed to fetch product photo index" }, 500);
  }
});

// GET single product_photo record
productPhotosRouter.get("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const record = await db
      .selectFrom("product_photo")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!record) {
      return c.json({ error: "Product photo not found" }, 404);
    }

    return c.json({ data: { ...record, url: photoUrl(record.photo) } });
  } catch (error) {
    logger.error("Failed to fetch product photo", error);
    return c.json({ error: "Failed to fetch product photo" }, 500);
  }
});

// POST upload a photo (multipart form: product_id + photo file)
productPhotosRouter.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const productId = Number(body.product_id);
    const file = body.photo;

    if (!productId || !(file instanceof File)) {
      return c.json({ error: "product_id and photo file are required" }, 400);
    }

    const product = await db
      .selectFrom("product")
      .select(["photos"])
      .where("id", "=", productId)
      .executeTakeFirst();

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    const ext =
      sanitizeFilenamePart(path.extname(file.name).toLowerCase()) || ".jpg";
    const dateDir = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const relPath = `${dateDir}/${randomUUID()}${ext}`;

    const absPath = resolveSafe(relPath);
    if (!absPath) {
      return c.json({ error: "Invalid photo path" }, 400);
    }

    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, Buffer.from(await file.arrayBuffer()));

    const photos = parsePhotos(product.photos);
    photos.push(relPath);

    await db
      .updateTable("product")
      .set({ photos: JSON.stringify(photos) })
      .where("id", "=", productId)
      .execute();

    const result = await db
      .insertInto("product_photo")
      .values({ product_id: productId, photo: relPath })
      .returning("id")
      .executeTakeFirstOrThrow();

    return c.json(
      {
        data: {
          id: Number(result.id),
          product_id: productId,
          photo: relPath,
          url: photoUrl(relPath),
        },
      },
      201,
    );
  } catch (error) {
    logger.error("Failed to upload product photo", error);
    return c.json({ error: "Failed to upload product photo" }, 500);
  }
});

// DELETE a photo by product_id + photo path (?product_id=&photo=)
productPhotosRouter.delete("/", async (c) => {
  try {
    const productId = Number(c.req.query("product_id"));
    const relPath = c.req.query("photo");

    if (!productId || !relPath) {
      return c.json({ error: "product_id and photo are required" }, 400);
    }

    const product = await db
      .selectFrom("product")
      .select(["photos"])
      .where("id", "=", productId)
      .executeTakeFirst();

    if (!product) {
      return c.json({ error: "Product not found" }, 404);
    }

    const remaining = parsePhotos(product.photos).filter((p) => p !== relPath);

    await db
      .updateTable("product")
      .set({ photos: JSON.stringify(remaining) })
      .where("id", "=", productId)
      .execute();

    await db
      .deleteFrom("product_photo")
      .where("product_id", "=", productId)
      .where("photo", "=", relPath)
      .execute();

    const absPath = resolveSafe(relPath);
    if (absPath) {
      await unlink(absPath).catch(() => {});
    }

    return c.json({
      data: { product_id: productId, photo: relPath },
      message: "Photo deleted",
    });
  } catch (error) {
    logger.error("Failed to delete product photo", error);
    return c.json({ error: "Failed to delete product photo" }, 500);
  }
});

// DELETE a product_photo record by id
productPhotosRouter.delete("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    const record = await db
      .selectFrom("product_photo")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!record) {
      return c.json({ error: "Product photo not found" }, 404);
    }

    const product = await db
      .selectFrom("product")
      .select(["photos"])
      .where("id", "=", record.product_id)
      .executeTakeFirst();

    if (product) {
      const remaining = parsePhotos(product.photos).filter(
        (p) => p !== record.photo,
      );
      await db
        .updateTable("product")
        .set({ photos: JSON.stringify(remaining) })
        .where("id", "=", record.product_id)
        .execute();
    }

    await db.deleteFrom("product_photo").where("id", "=", id).execute();

    const absPath = resolveSafe(record.photo);
    if (absPath) {
      await unlink(absPath).catch(() => {});
    }

    return c.json({ data: { id }, message: "Photo deleted" });
  } catch (error) {
    logger.error("Failed to delete product photo", error);
    return c.json({ error: "Failed to delete product photo" }, 500);
  }
});

export default productPhotosRouter;