import { Hono } from "hono";
import MiniSearch from "minisearch";
import { db } from "../db/db";
import { sql } from "kysely";
// import { db } from "./db";

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
    ])
    .execute();
  return products.map((p) => ({
    ...p,
    id: p.id.toString(),
    places: JSON.parse(p.places),
    analogs: [],
    barcodes: [],
    oeNumbers: [],
  })) as SearchRecord;
}

async function getAvailability(ids: string[]) {
  if (!ids.length) {
    return [];
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

  return stocks.map((el) => ({ ...el, id: el.id?.toString() })) as Promise<
    {
      id: string;
      quantity: number;
      price: number;
    }[]
  >;
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
  return [];
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

(async () => {
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

  const docs = await Promise.all(
    documents.map(async (el) => ({
      ...el,
      analogs: analogs.find((a) => a.id === el.id)?.articles || [],
      oeNumbers: analogs.find((a) => a.id === el.id)?.oeNumbers || [],
      article_search: el.article.replace(/[^\p{L}\p{N}]/gu, ""),
    })),
  );
  miniSearch.addAll(docs);
})();

const searchRoutes = new Hono();

searchRoutes.get("/", async (c) => {
  try {
    const query = c.req.query();
    if (!query?.q) {
      return c.json({ items: [] }, 400);
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
        photoUrl: "",
        foundBy: Object.entries(
          Object.entries(r.match).reduce((p, c) => {
            const n = JSON.parse(JSON.stringify(p));
            c[1].forEach((v) => {
              if (n[v]) {
                n[v] = `${n[v]}, ${c[0]}`;
              } else {
                n[v] = c[0];
              }
              console.log(n);
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
