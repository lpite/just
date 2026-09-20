import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { cors } from "hono/cors";
import { logger } from "./lib/logger";
import { initSchema } from "./db/db";
import productsRouter from "./routes/products";
import partnersRouter from "./routes/partners";
import salesDocumentsRouter from "./routes/sales-documents";
import incomeDocumentsRouter from "./routes/income-documents";
import productStockRouter from "./routes/product-stock";
import productPriceRouter from "./routes/product-price";
import priceSettingDocumentsRouter from "./routes/price-setting-documents";
import posRouter from "./routes/pos";
import shopRouter from "./routes/shop";
import searchRoutes from "./routes/search";

const app = new Hono();

app.use(
	"*",
	cors({
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
		origin: "",
	}),
);

app.use(async (c, next) => {
	const start = Date.now();
	const method = c.req.method;
	const path = c.req.path;

	await next();

	const duration = Date.now() - start;
	const status = c.res.status;

	logger.info(`${method} ${path} - ${status} (${duration}ms)`);
});

app.get("/health", (c) => {
	return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api", (c) => {
	return c.json({
		name: "ERP Backend",
		version: "1.0.0",
	});
});

// Register CRUD routes
app.route("/api/products", productsRouter);
app.route("/api/partners", partnersRouter);
app.route("/api/sales-documents", salesDocumentsRouter);
app.route("/api/income-documents", incomeDocumentsRouter);
app.route("/api/product-stock", productStockRouter);
app.route("/api/product-price", productPriceRouter);
app.route("/api/price-setting-documents", priceSettingDocumentsRouter);
app.route("/1c_connector/index.php", posRouter);
app.route("/shop/hs", shopRouter);
app.route("/search", searchRoutes);

app.use("*", serveStatic({ root: "./static" }));
app.get(
	"*",
	serveStatic({
		root: "./static",
		path: "index.html",
	}),
);
// initSchema()

export default {
	port: 3000,
	fetch: app.fetch,
	hostname: "0.0.0.0",
};
