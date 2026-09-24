import { Hono } from "hono";
import { db } from "../db/db";
import { ParseJSONResultsPlugin, sql } from "kysely";

const shopRouter = new Hono();

type SearchRecord = {
  id: string;
  name: string;
  nameAlt: string;
  oem: string;
  article: string;
  brand: string;
  barcodes: string[];
  analogs: string[];
  oeNumbers: string[];
};

shopRouter.get("/api/products/search-data", async (c) => {
  const products = await db
    .selectFrom("product")
    .select([
      "id",
      "name",
      "nameAlt",
      "oem",
      "article",
      "brand",
      "units",
      "places",
      "photos",
    ])
    .withPlugin(new ParseJSONResultsPlugin())
    .execute();

  return c.json(
    products.map((p) => ({
      ...p,
      id: p.id.toString(),
      places: JSON.parse(p.places),
      analogs: [],
      barcodes: [],
      oeNumbers: [],
      photoUrl: p.photos[0],
    })),
  );
});

type Ava = {
  id: string;
  quantity: number;
  price: number;
};

shopRouter.get("/api/products/availability", async (c) => {
  const dateParam = new Date().toISOString().split("T")[0];

  const ids = c.req.query("ids")?.split(",");

  if (!ids) {
    return c.json([]);
  }

  const stocks = await db
    .selectFrom("product_stock")
    .leftJoin(
      "product_price",
      "product_price.product_id",
      "product_stock.product_id",
    )
    .select([
      "product_stock.product_id as id",
      "product_price.price",
      sql<number>`SUM(quantity)`.as("quantity"),
    ])
    .where(
      "product_stock.product_id",
      "in",
      ids.map((id) => Number(id)),
    )
    .groupBy("product_stock.product_id")
    .execute();

  return c.json(
    stocks.map((el) => ({ ...el, id: el.id?.toString() })) as Ava[],
  );
});

export default shopRouter;
