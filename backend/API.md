# ERP Backend API

Base URL: `http://localhost:3000` (configurable via `PORT` env, default 3000)

All responses are JSON unless noted. The backend is a Hono app backed by SQLite (better-sqlite3 via Kysely). CORS is enabled with `*` origin.

## Conventions

- Error responses: `{ "error": "<message>" }` with a non-2xx status.
- List responses: `{ "data": [...], "count": <n> }`.
- Single-resource responses: `{ "data": {...} }` (some also include `message`).
- Filters via query strings where noted.
- `posted` fields are booleans (stored as 0/1).

## Global endpoints

### `GET /health`

Health probe.

```json
{ "status": "ok", "timestamp": "2026-09-26T10:00:00.000Z" }
```

### `GET /api`

API metadata.

```json
{ "name": "ERP Backend", "version": "1.0.0" }
```

---

## Products

Base path: `/api/products`

### `GET /api/products`

List all products (no filters at present).

### `GET /api/products/:id`

Get one product.

- `404` if not found.

### `POST /api/products`

Create a product.

Body:

```json
{ "name": "Brake Disc" }
```

- `name` required → `400` if missing.
- Response `201`:

```json
{ "data": { "id": 1, "name": "Brake Disc" } }
```

### `PUT /api/products/:id`

Update a product name.

- `name` required → `400` if missing.

Body:

```json
{ "name": "New Name" }
```

### `DELETE /api/products/:id`

Delete a product.

```json
{ "data": { "id": 1 }, "message": "Product deleted" }
```

### Product object

| Field         | Type    | Notes                                                      |
| ------------- | ------- | ---------------------------------------------------------- |
| `id`          | integer | PK                                                         |
| `name`        | string  |                                                            |
| `nameAlt`     | string  |                                                            |
| `oem`         | string  |                                                            |
| `article`     | string  |                                                            |
| `description` | string  |                                                            |
| `brand`       | string  |                                                            |
| `units`       | string  |                                                            |
| `places`      | string  | JSON array string, e.g. `["A-1","B-2"]`                    |
| `photos`      | string  | JSON array string of photo paths relative to `data/files/` |

---

## Partners

Base path: `/api/partners`

### `GET /api/partners`

### `GET /api/partners/:id`

- `404` if not found.

### `POST /api/partners`

```json
{ "name": "ACME" }
```

- `name` required → `400`.
- Response `201`: `{ "data": { "id": 1, "name": "ACME" } }`

### `PUT /api/partners/:id`

- `name` required → `400`.

### `DELETE /api/partners/:id`

`{ "data": { "id": 1 }, "message": "Partner deleted" }`

---

## Sales documents

Base path: `/api/sales-documents`

### `GET /api/sales-documents`

List all sales documents. Note: `sales_document` also has a `notes` column in schema (not exposed via API mutations).

### `GET /api/sales-documents/:id`

Returns document with its items included:

```json
{
  "data": { "id": 1, "date": "...", "partner_id": 1, "posted": 0, "items": [] }
}
```

### `POST /api/sales-documents`

Creates document + items atomically (transaction).

Body:

```json
{
  "date": "2026-09-26T10:00:00.000Z",
  "partner_id": 1,
  "items": [{ "product_id": 1, "price": 100, "quantity": 2 }]
}
```

- `partner_id` required → `400`.
- `date` optional (defaults to now).
- Response `201`: `{ "data": { "id": 1, "date": "...", "partner_id": 1, "posted": false, "items": [...] } }`

### `POST /api/sales-documents/:id/post`

Posts the document: creates `product_stock` records with **negative** quantity (`-quantity`) linked to the document, sets `posted: 1`. Idempotent re-post: removes prior stock records for the document first.

```json
{
  "data": { "id": 1, "posted": true },
  "message": "Sales document posted successfully"
}
```

### `POST /api/sales-documents/:id/unpost`

Unposts the document: if currently posted, inserts reversal stock records with **positive** quantity. Note: sets `posted: 1` in the DB (does not actually flip to 0 — current behavior).

### `PUT /api/sales-documents/:id`

Updates `date` and `partner_id`.

### `DELETE /api/sales-documents/:id`

Deletes items then the document.
`{ "data": { "id": 1 }, "message": "Sales document deleted" }`

### Sales document item object

| Field         | Type            |
| ------------- | --------------- |
| `id`          | integer         |
| `document_id` | integer         |
| `product_id`  | integer         |
| `price`       | real            |
| `quantity`    | real            |
| `created_at`  | text (datetime) |

---

## Income documents

Base path: `/api/income-documents`

### `GET /api/income-documents`

### `GET /api/income-documents/:id`

Returns document with items.

### `POST /api/income-documents`

Same shape as sales documents:

```json
{
  "date": "2026-09-26T10:00:00.000Z",
  "partner_id": 1,
  "items": [{ "product_id": 1, "price": 50, "quantity": 10 }]
}
```

- `partner_id` required → `400`.
- Response `201`.

### `POST /api/income-documents/:id/post`

Posts: creates `product_stock` records with **positive** quantity, sets `posted: true`.

```json
{
  "data": { "id": 1, "posted": true },
  "message": "Income document posted successfully"
}
```

### `POST /api/income-documents/:id/unpost`

Not implemented — always throws and returns `500`.

### `PUT /api/income-documents/:id`

Updates `date` and `partner_id`.

### `DELETE /api/income-documents/:id`

Deletes items then document.

---

## Product stock

Base path: `/api/product-stock`

#### `GET /api/product-stock`

Aggregated stock (`SUM(quantity)` grouped by `product_id`) for records with `DATE(timestamp) <= ?date`. Defaults to today.

```json
{
  "data": [{ "product_id": 1, "quantity": 12 }],
  "date": "2026-09-26",
  "count": 1
}
```

Query params: `date` (YYYY-MM-DD, optional).

#### `GET /api/product-stock/product/:product_id`

Same aggregation for one product. If none recorded, returns quantity `0` (not 404).
Query params: `date`.

#### `GET /api/product-stock/history/all`

All raw `product_stock` rows.

#### `GET /api/product-stock/history/product/:product_id`

Raw rows for one product. `404` if none.

#### `GET /api/product-stock/:id`

Single raw stock entry. `404` if not found.

#### `POST /api/product-stock`

```json
{ "product_id": 1, "quantity": 5 }
```

- `product_id` and `quantity` required → `400`.
- Response `201`.

#### `PUT /api/product-stock/:id`

`{ "quantity": 7 }` — `quantity` required → `400`.

#### `DELETE /api/product-stock/:id`

`{ "data": { "id": 1 }, "message": "Stock entry deleted" }`

### Stock object

| Field         | Type                                       |
| ------------- | ------------------------------------------ |
| `id`          | integer                                    |
| `product_id`  | integer                                    |
| `quantity`    | real (negative = sales, positive = income) |
| `document_id` | integer (nullable in inserts)              |
| `timestamp`   | text (ISO datetime)                        |

---

## Product prices

Base path: `/api/product-price`

### `GET /api/product-price`

All price entries.

### `GET /api/product-price/product/:product_id`

Prices for one product. `404` if none.

### `GET /api/product-price/:id`

Single price entry. `404` if not found.

### `POST /api/product-price`

```json
{ "product_id": 1, "price": 150 }
```

- `product_id` and `price` required → `400`.
- Response `201`.

### `PUT /api/product-price/:id`

`{ "price": 160 }` — `price` required → `400`.

### `DELETE /api/product-price/:id`

`{ "data": { "id": 1 }, "message": "Price entry deleted" }`

### Price object

| Field        | Type    |
| ------------ | ------- |
| `id`         | integer |
| `product_id` | integer |
| `price`      | real    |
| `timestamp`  | text    |

There is also a DB view `product_price_latest` (`product_id`, `price`) with the latest price per product, not exposed via API.

---

## Price setting documents

Base path: `/api/price-setting-documents`

### `GET /api/price-setting-documents`

### `GET /api/price-setting-documents/:id`

Document with items.

### `POST /api/price-setting-documents`

```json
{
  "date": "2026-09-26T10:00:00.000Z",
  "items": [{ "product_id": 1, "price": 150 }]
}
```

- `partner_id` not used here. Response `201`.

### `POST /api/price-setting-documents/:id/post`

If not posted: creates a `product_price` record per item, sets `posted: true`.

```json
{
  "data": { "id": 1, "posted": true },
  "message": "Price setting document posted successfully"
}
```

### `DELETE /api/price-setting-documents/:id/post`

Unpost: if currently posted, finds the most recent matching `product_price` per item and deletes it, sets `posted: false`.

```json
{
  "data": { "id": 1, "posted": false },
  "message": "Price setting document unposted successfully"
}
```

### `PUT /api/price-setting-documents/:id`

Updates `date` only.

### `DELETE /api/price-setting-documents/:id`

Deletes items then document.
`{ "data": { "id": 1 }, "message": "Price setting document deleted" }`

---

## Product photo serving

Base path: `/api/get-photo.php`

### `GET /api/get-photo.php?photo=<base64>`

Returns the binary image file.

Query params:

- `photo` (required): base64-encoded path of a photo **relative to** `data/files/`, e.g. base64 of `20240205/937041b3-7ff9-4e12-ad0d-f771e1f02981_1631.jpg`.

Behavior:

- `400` if `photo` param missing.
- `404` if the file does not exist or the decoded path escapes `data/files/` (path-traversal protected).
- `200` with the file bytes; `Content-Type` from extension (jpeg/png/gif/webp/avif/svg) or `application/octet-stream`; `Cache-Control: public, max-age=86400`.

This maps to product `photos[0]` from the product/search endpoints.

---

## Search

Base path: `/search`

### `GET /search?q=<query>&onlyInfo=<bool>`

Full-text product search (minisearch). Built once on first request from the `product` table.

Query params:

- `q` (required) → `400` `{ "items": [] }` if missing.
- `onlyInfo` (`"true"`) → returns raw minisearch matches.

Response (default):

```json
[
  {
    "id": "1",
    "name": "...",
    "article": "...",
    "oem": "...",
    "brand": "...",
    "places": ["A-1"],
    "photoUrl": "20240205/xxx.jpg",
    "quantity": 4,
    "price": 150,
    "foundBy": "..."
  }
]
```

`quantity`/`price` come from joining stock (`SUM(quantity)`) and latest price by `product_id`.

---

## Shop (mobile/shop app endpoints)

Base path: `/shop/hs`

### `GET /shop/hs/api/products/search-data`

Catalog for the shop app. Returns all products with:

- `id` (string), `name`, `nameAlt`, `oem`, `article`, `brand`, `units`
- `places` parsed as array
- `analogs`, `barcodes`, `oeNumbers` (all `[]`)
- `photoUrl` = first photo path

### `GET /shop/hs/api/products/availability?ids=1,2,3`

Availability + price for comma-separated product ids.

Query params: `ids` (comma-separated). `[]` if missing.

Response:

```json
[{ "id": "1", "price": 150, "quantity": 4 }]
```

Quantity is `SUM(quantity)` from stock grouped by product.

---

## 1C connector

Base path: `/1c_connector/index.php`

Single `POST` endpoint. Body is a JSON envelope describing a 1C request:

```json
{ "url": "/shop/hs/...", "method": "GET|POST", "query": "...", "body": { ... } }
```

Dispatch table (method:url):

| Case                                  | Description                                                                                                                                                                                          |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET:/shop/hs/app/agent-and-partner/` | Lists partners. Each item adds `partnerName`, `agentName` (both = `name`), and `partnerId` (string id).                                                                                              |
| `GET:/shop/hs/app/product`            | Returns `[]`.                                                                                                                                                                                        |
| `GET:/shop/hs/app/comment/1`          | Returns empty string.                                                                                                                                                                                |
| `GET:/shop/hs/app/sell-document/1`    | Returns `sum(quantity * price)` for today's sales for `partner_id = 1`, formatted with 2 decimals (or `"0"`).                                                                                        |
| `GET:/shop/hs/app/stats`              | Sales stats: per sales document grouped products with `searchCode`, `name`, `time`, `price`, `quantity`, `sum`, `place1..3`, `type: "sale"`, `day: "today"                                           | "yesterday"`, `partnerName`, `partnerId`, `sum`, `comment: "meowe"`. |
| `GET:/shop/hs/api/search`             | Parses query; currently returns `[]`.                                                                                                                                                                |
| `POST:/shop/hs/pos/sell`              | Creates/finds today's sales document for `partnerId`, inserts `sales_document_item` records and negative `product_stock` records. Rejects `400` if any product `quantity <= 0`. Returns `"success"`. |
| anything else                         | Returns `"NOT IMPLEMENTED"` with `500`.                                                                                                                                                              |

---

## Everything else

Static files are served from `./static`; unknown paths fall back to `./static/index.html` (SPA fallback).
