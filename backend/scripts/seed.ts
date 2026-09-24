import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";

interface TestProduct {
  ref: string;
  searchCode: string;
  code: string;
  vendorCode: string;
  name: string;
  price: number;
  quantity: number;
  units: string;
  place1: string;
  place2: string;
  place3: string;
  photo: string;
  photoPath: string;
  description: string;
  needToSell: boolean | string;
}

const dbPath = path.resolve(process.cwd(), config.DATABASE_URL);
const jsonPath = path.resolve(process.cwd(), "test-data/product.json");
const product2Path = path.resolve(process.cwd(), "test-data/product2.json");
const photoPath = path.resolve(process.cwd(), "test-data/product-photo.json");

function parseJson(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.error("Test data file not found:", filePath);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${filePath}:`, err);
    process.exit(1);
  }
}

const products = parseJson(jsonPath) as TestProduct[];
const product2 = parseJson(product2Path) as {
  searchCode: string;
  manufacturer?: string;
}[];
const productPhotos = parseJson(photoPath) as {
  productId: string;
  path: string;
}[];

console.log(`Loaded ${products.length} products from ${jsonPath}`);
console.log(`Loaded ${product2.length} rows from ${product2Path}`);
console.log(`Loaded ${productPhotos.length} photos from ${photoPath}`);

const db = new Database(dbPath);

const reset = process.argv.includes("--reset");

const countProduct = (
  db.prepare("SELECT COUNT(*) AS c FROM product").get() as { c: number }
).c;
if (countProduct > 0) {
  if (!reset) {
    console.log(
      `Product table already contains ${countProduct} rows. Re-run with --reset to clear data first.`,
    );
    process.exit(0);
  }
  db.exec(`
    DELETE FROM price_setting_document_item;
    DELETE FROM price_setting_document;
    DELETE FROM sales_document_item;
    DELETE FROM sales_document;
    DELETE FROM income_document_item;
    DELETE FROM income_document;
    DELETE FROM product_price;
    DELETE FROM product_stock;
    DELETE FROM partner;
    DELETE FROM product;
    DELETE FROM sqlite_sequence;
  `);
  console.log("Cleared existing data.");
}

const insertProduct = db.prepare(`
  INSERT INTO product (id,name, nameAlt, oem, article, description, brand, units, places)
  VALUES (@id,@name, @nameAlt, @oem, @article, @description, @brand, @units, @places)
`);

const insertPrice = db.prepare(`
  INSERT INTO product_price (product_id, price, timestamp)
  VALUES (@product_id, @price, datetime('now'))
`);

const insertDocument = db.prepare(`
  INSERT INTO income_document (date, posted) VALUES (datetime('now'), 1)
`);

const insertStock = db.prepare(`
  INSERT INTO product_stock (product_id, quantity, document_id, timestamp)
  VALUES (@product_id, @quantity, @document_id, datetime('now'))
`);

function parsePlaces(p: TestProduct): string[] {
  return [p.place1, p.place2, p.place3].filter(
    (place) => place && place.trim() !== "",
  );
}

const insertAll = db.transaction(() => {
  const docResult = insertDocument.run() as unknown as {
    lastInsertRowid: bigint | number;
  };
  const documentId = Number(docResult.lastInsertRowid);
  console.log(`Created opening income_document id=${documentId}`);

  let stockCount = 0;
  let priceCount = 0;

  for (const p of products) {
    const places = JSON.stringify(parsePlaces(p));
    let productResult: any = { lastInsertRowid: null };
    try {
      const id = Number(p.searchCode);
      if (!id) {
        console.log(p);
        throw new Error("shity id");
      }
      productResult = insertProduct.run({
        name: p.name || "",
        nameAlt: "",
        oem: p.vendorCode || "",
        article: p.code || "",
        description: p.description || "",
        brand: "",
        units: p.units || "",
        places,
        id: id,
      }) as unknown as { lastInsertRowid: bigint | number };
    } catch (err) {
      console.error(p, err);
    }

    const productId = Number(productResult.lastInsertRowid);
    if (!productId) {
      continue;
    }
    if (p.quantity && p.quantity > 0 && p.quantity !== 0) {
      insertStock.run({
        product_id: productId,
        quantity: p.quantity,
        document_id: documentId,
      });
      stockCount++;
    }

    if (p.price !== undefined && p.price !== null && p.price > 0) {
      insertPrice.run({
        product_id: productId,
        price: p.price,
      });
      priceCount++;
    }
  }

  return { stockCount, priceCount };
});

const brandBySearchCode = new Map<string, string>();
for (const row of product2) {
  if (row.manufacturer) {
    brandBySearchCode.set(row.searchCode, row.manufacturer);
  }
}

const photosBySearchCode = new Map<string, string[]>();
for (const photo of productPhotos) {
  const match = photo.productId.match(/(\d+)$/);
  if (!match) continue;
  const key = String(Number(match[1]));
  const path = photo.path.replace(/\\/g, "/");
  const list = photosBySearchCode.get(key) || [];
  if (!list.includes(path)) {
    list.push(path);
  }
  photosBySearchCode.set(key, list);
}

const updateBrand = db.prepare(
  `UPDATE product SET brand = @brand WHERE id = @id`,
);
const updatePhotos = db.prepare(
  `UPDATE product SET photos = @photos WHERE id = @id`,
);

const updateAll = db.transaction(() => {
  let brandCount = 0;
  let photoCount = 0;
  for (const p of products) {
    const id = Number(p.searchCode);
    if (!id) continue;

    const brand = brandBySearchCode.get(p.searchCode);
    if (brand) {
      updateBrand.run({ brand, id });
      brandCount++;
    }

    const photos = photosBySearchCode.get(String(id));
    if (photos?.length) {
      updatePhotos.run({ photos: JSON.stringify(photos), id });
      photoCount++;
    }
  }
  return { brandCount, photoCount };
});

const startedAt = Date.now();
const result = insertAll();
const updateResult = updateAll();
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(2);

const totals = {
  products: (
    db.prepare("SELECT COUNT(*) AS c FROM product").get() as { c: number }
  ).c,
  stock: (
    db.prepare("SELECT COUNT(*) AS c FROM product_stock").get() as { c: number }
  ).c,
  prices: (
    db.prepare("SELECT COUNT(*) AS c FROM product_price").get() as { c: number }
  ).c,
  docs: (
    db.prepare("SELECT COUNT(*) AS c FROM income_document").get() as {
      c: number;
    }
  ).c,
};

console.log(`Seeded in ${elapsed}s`);
console.log("Summary:");
console.log(`  products:         ${totals.products}`);
console.log(`  product_stock:    ${totals.stock} (${result.stockCount} added)`);
console.log(
  `  product_price:    ${totals.prices} (${result.priceCount} added)`,
);
console.log(`  income_documents: ${totals.docs}`);
console.log("Updates done:");
console.log(`  brands:           ${updateResult.brandCount}`);
console.log(`  photos:           ${updateResult.photoCount}`);

db.close();
