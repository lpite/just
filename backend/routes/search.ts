import { Hono } from "hono";
import MiniSearch from "minisearch";
import { db } from "../db/db";
import { sql } from "kysely";
// import { db } from "./db";

let FILLED = false;

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
  photoUrl: string;
};

async function getProducts() {
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
    .execute();

  const productsForSearch = products.map((p) => ({
    ...p,
    id: p.id.toString(),
    places: JSON.parse(p.places) as string[],
    analogs: [] as string[],
    barcodes: [] as string[],
    oeNumbers: [] as string[],
    photoUrl:
      Buffer.from(JSON.parse(p.photos || "[]")[0] || "").toBase64() || "",
  }));

  return productsForSearch;
}

async function getAvailability(ids: string[]) {
  if (!ids.length) {
    return [];
  }
  const stocks = await db
    .selectFrom("product")
    .leftJoin("product_stock", "product_stock.product_id", "product.id")
    .leftJoin(
      "product_price_latest",
      "product_price_latest.product_id",
      "product.id",
    )
    .select([
      "product.id as id",
      "product_price_latest.price",
      sql<number>`SUM(product_stock.quantity)`.as("quantity"),
    ])
    .where(
      "product.id",
      "in",
      ids.map((id) => Number(id)),
    )
    .groupBy("product.id")
    .execute();

  return stocks.map((el) => ({ ...el, id: el.id?.toString() })) as {
    id: string;
    quantity: number;
    price: number;
  }[];
}

let miniSearch = new MiniSearch<SearchRecord>({
  fields: [
    "id",
    "article",
    "article_search",
    "oem",
    "name",
    "brand",
    "description",
    "analogs",
    "oeNumbers",
  ], // fields to index for full-text search
  storeFields: [
    "id",
    "article",
    "oem",
    "name",
    "description",
    "brand",
    "analogs",
    "oeNumbers",
    "units",
    "places",
    "photoUrl",
  ], // fields to return with search results
  processTerm: (term: string, _fieldName: any) => {
    term = term.toLowerCase();

    const terms = new Set<string>();

    terms.add(term);
    const normalized = term.replace(/[^\p{L}\p{N}]/gu, "");
    terms.add(normalized);

    const match = normalized.match(/^([\p{L}]+)(\d+)$/u);
    if (match) {
      terms.add(match[1]); // letters
      terms.add(match[2]); // digits
    }

    const numberGroups = term.match(/\d+/g);
    if (numberGroups) {
      for (const group of numberGroups) {
        terms.add(group);
      }
    }

    return [...terms];
  },
});

async function getAnalogs(
  data: { id: string; article: string; supplier: string }[],
) {
  return [] as any[];
  // const articles = await db
  //   .selectFrom("article")
  //   .leftJoin("supplier", "article.supplier_id", "supplier.id")
  //   .where(
  //     "supplier.description",
  //     "in",
  //     data.map((el) => el.supplier),
  //   )
  //   .where(
  //     "article",
  //     "in",
  //     data.map((el) => el.article),
  //   )
  //   .select(["article.id", "article", "supplier.description"])
  //   .execute();

  // return Promise.all(
  //   data.map(async (el) => {
  //     const catalogId = articles.find(
  //       (a) => el.article === a.article && a.description === el.supplier,
  //     )?.id;

  //     if (!catalogId) {
  //       return {
  //         articles: [],
  //         id: el.id,
  //       };
  //     }
  //     const oeNumbers = await db
  //       .selectFrom("article_oe_link")
  //       .leftJoin("article_oe", "article_oe_link.oe_number_id", "article_oe.id")
  //       .leftJoin(
  //         "manufacturers",
  //         "manufacturers.id",
  //         "article_oe.manufacturer_id",
  //       )
  //       .select(["oe_number", "manufacturers.description as manufacturer"])
  //       .where("article_oe_link.article_id", "=", catalogId)
  //       .execute();

  //     const analogs = await db
  //       .selectFrom("article_oe")
  //       .leftJoin(
  //         "article_oe_link",
  //         "article_oe_link.oe_number_id",
  //         "article_oe.id",
  //       )
  //       .leftJoin("article", "article.id", "article_oe_link.article_id")
  //       .leftJoin("supplier", "supplier.id", "article.supplier_id")
  //       .select(["supplier.description", "article.article"])
  //       .distinct()
  //       .where(
  //         "article_oe.oe_number",
  //         "in",
  //         oeNumbers.map((el) => el.oe_number),
  //       )
  //       .where("article.id", "!=", catalogId)
  //       .execute();
  //     return {
  //       articles: analogs.map(
  //         (a) => `${a.description} ${a.article?.replace(/\s/g, "")}`,
  //       ),
  //       oeNumbers: oeNumbers.map((oe) => `${oe.manufacturer} ${oe.oe_number}`),
  //       id: el.id,
  //     };
  //   }),
  // );
}

async function fillSearchDb() {
  const documents = await getProducts().catch((err) => {
    console.error(err);
    return [];
  });

  if (!documents || !documents.length) {
    console.error("no documents");
    return;
  }

  console.log("got", documents.length);

  const analogs = await getAnalogs(
    documents
      .filter((el) => {
        if (!el?.article.length || !el?.brand.length) {
          return false;
        }
        return true;
      })
      .map((el) => ({
        id: el.id,
        article: el.article,
        supplier: el.brand,
      })),
  );

  const docs = documents.map((el) => ({
    ...el,
    analogs: analogs.find((a) => a.id === el.id)?.articles || [],
    oeNumbers: analogs.find((a) => a.id === el.id)?.oeNumbers || [],
    article_search: el.article.replace(/[^\p{L}\p{N}]/gu, ""),
  }));

  miniSearch.addAll(docs);
  FILLED = true;
}

const searchRoutes = new Hono();

searchRoutes.get("/", async (c) => {
  try {
    const query = c.req.query();
    if (!query?.q) {
      return c.json({ items: [] }, 400);
    }

    if (!FILLED) {
      await fillSearchDb();
    }

    let q: string = query.q.toString();
    const onlyInfo = query.onlyInfo === "true";

    let results = miniSearch.search(q, {
      prefix: true,
      combineWith: "AND",
    });

    if (onlyInfo) {
      return c.json(results);
    }

    const a = await getAvailability(results.map((el) => el.id));

    return c.json(
      results.map((r) => ({
        ...r,
        ...a.find((item) => item.id === r.id),
        foundBy: Object.entries(
          Object.entries(r.match).reduce((p, c) => {
            const n = JSON.parse(JSON.stringify(p));
            c[1].forEach((v) => {
              if (n[v]) {
                n[v] = `${n[v]}, ${c[0]}`;
              } else {
                n[v] = c[0];
              }
            });
            return n;
          }, {}),
        )
          .map((v, f) => `${v} ${f}`)
          .join(" "),
      })),
    );
  } catch (err) {
    console.error(err);
    return c.json([]);
  }
});

export default searchRoutes;
