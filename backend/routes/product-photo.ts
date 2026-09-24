import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "../config";
import { logger } from "../lib/logger";

const productPhotoRouter = new Hono();

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

productPhotoRouter.get("/", async (c) => {
  // accepts "photo" get param with base64 encoded path to photo that stored inside data/files/*
  try {
    const encoded = c.req.query("photo");
    if (!encoded) {
      return c.json({ error: "photo parameter is required" }, 400);
    }

    const decodedPath = Buffer.from(encoded, "base64").toString("utf8");
    console.log(decodedPath);
    const root = path.resolve(config.FILE_STORAGE_PATH);
    const filePath = path.resolve(root, decodedPath);

    if (filePath !== root && !filePath.startsWith(root + path.sep)) {
      return c.text("Not found", 404);
    }

    const data = await readFile(filePath);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    logger.error("Failed to serve photo", error);
    return c.text("Not found", 404);
  }
});

export default productPhotoRouter;
