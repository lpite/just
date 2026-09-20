import Database from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { config } from "../config";

import type { DB } from "./db-types";
import { sql } from "bun";

export const db = new Kysely<DB>({
  dialect: new SqliteDialect({
    database: new Database(config.DATABASE_URL),
  }),
});

export async function initSchema() {
  await db.schema
    .createTable("product")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().notNull().autoIncrement())
    .addColumn("name", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("nameAlt", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("oem", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("article", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("description", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("brand", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("units", "text", (c) => c.notNull().defaultTo(""))
    .addColumn("places", "text", (c) => c.notNull().defaultTo("[]"))
    .execute();

  await db.schema
    .createTable("partner")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().notNull().autoIncrement())
    .addColumn("name", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("sales_document")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().notNull().autoIncrement())
    .addColumn("date", "datetime")
    .addColumn("partner_id", "integer", (c) => c.references("partner.id"))
    .addColumn("posted", "boolean", (c) => c.defaultTo(false))
    .execute();

  await db.schema
    .createTable("sales_document_item")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("document_id", "integer", (c) =>
      c.notNull().references("sales_document.id"),
    )
    .addColumn("product_id", "integer", (c) =>
      c.notNull().references("product.id"),
    )
    .addColumn("price", "real", (c) => c.notNull().defaultTo(0))
    .addColumn("quantity", "real", (c) => c.notNull().defaultTo(0))
    .addColumn("created_at", "text", (c) =>
      c.notNull().defaultTo(sql`datetime('now')`),
    )
    .execute();

  await db.schema
    .createTable("product_stock")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("product_id", "integer", (c) => c.references("product.id"))
    .addColumn("quantity", "real", (c) => c.notNull())
    .addColumn("document_id", "integer", (c) => c.notNull())
    .addColumn("timestamp", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("product_price")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("product_id", "integer", (c) => c.references("product.id"))
    .addColumn("price", "real", (c) => c.notNull().defaultTo(0))
    .addColumn("timestamp", "text", (c) => c.notNull())
    .execute();

  await db.schema
    .createTable("income_document")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("date", "datetime")
    .addColumn("partner_id", "integer", (c) => c.references("partner.id"))
    .addColumn("posted", "boolean", (c) => c.defaultTo(false))
    .execute();

  await db.schema
    .createTable("income_document_item")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("document_id", "integer", (c) =>
      c.references("income_document.id"),
    )
    .addColumn("product_id", "integer", (c) => c.references("product.id"))
    .addColumn("price", "real", (c) => c.notNull().defaultTo(0))
    .addColumn("quantity", "real", (c) => c.notNull().defaultTo(0))
    .execute();

  await db.schema
    .createTable("price_setting_document")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("date", "datetime")
    .addColumn("posted", "boolean", (c) => c.defaultTo(false))
    .execute();

  await db.schema
    .createTable("price_setting_document_item")
    .ifNotExists()
    .addColumn("id", "integer", (c) => c.primaryKey().autoIncrement())
    .addColumn("document_id", "integer", (c) =>
      c.references("price_setting_document.id"),
    )
    .addColumn("product_id", "integer", (c) => c.references("product.id"))
    .addColumn("price", "real", (c) => c.notNull().defaultTo(0))
    .execute();
}
