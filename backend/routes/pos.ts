import { Hono } from "hono";
import { db } from "../db/db";
import { ParseJSONResultsPlugin, sql } from "kysely";

const posRouter = new Hono();

posRouter.post("/", async (c) => {
	const json = (await c.req.json()) as {
		url: string;
		method: string;
		query: string;
		body: any;
	};

	switch (`${json.method}:${json.url}`) {
		case "GET:/shop/hs/app/agent-and-partner/": {
			const partners = await db
				.selectFrom("partner")
				.selectAll()
				.execute();

			return c.json(
				partners.map((p) => ({
					...p,
					partnerName: p.name,
					agentName: p.name,
					partnerId: p.id.toString(),
				})),
			);
		}
		case "GET:/shop/hs/app/product": {
			return c.json([]);
		}
		case "GET:/shop/hs/app/comment/1": {
			return c.text("");
		}
		case "GET:/shop/hs/app/sell-document/1": {
			const currentDay = new Date().getDate().toString();
			const { sum } = await db
				.selectFrom("sales_document_item")
				.leftJoin(
					"sales_document",
					"sales_document.id",
					"sales_document_item.document_id",
				)
				.select(sql<number>`sum(quantity * price)`.as("sum"))
				.where("sales_document.partner_id", "=", 1)
				.where(
					sql<any>`strftime('%d',sales_document.date) = ${currentDay}`,
				)
				.orderBy("sales_document.date", "desc")
				.executeTakeFirstOrThrow();

			console.log(sum.toFixed(2));
			return c.text(`${sum.toFixed(2)}`);
		}
		case "GET:/shop/hs/api/search": {
			const qArray = json.query
				.slice(3)
				.replace(/[*()]/gi, "")
				.replace(/\b(OR|AND)\b/gi, "")
				.replace(/\s+/g, " ")
				.split(" ");
			const words = new Set<string>();
			qArray.forEach((word) => {
				words.add(word);
			});
			const uniqueWords = [...words];

			if (
				uniqueWords.at(-1)?.trim() === uniqueWords.slice(0, -1).join("")
			) {
				uniqueWords.pop();
			}
			console.log(uniqueWords);
			return c.json([]);
		}
		case "GET:/shop/hs/app/stats": {
			const sales_documents = await db
				.selectFrom("sales_document")
				.leftJoin(
					"sales_document_item",
					"sales_document_item.document_id",
					"sales_document.id",
				)
				.leftJoin(
					"product",
					"product.id",
					"sales_document_item.product_id",
				)
				.leftJoin("partner", "partner.id", "sales_document.partner_id")
				.select([
					"partner.id as partnerId",
					"partner.name as partnerName",
					sql`json_group_array(
							json_object(
								'searchCode',product.id,
								'name',product.name,
								'time', datetime('now'),
								'price',sales_document_item.price,
								'quantity',sales_document_item.quantity,
								'sum',sales_document_item.price * sales_document_item.quantity,
								'places',product.places
								))`.as("products"),
					sql`strftime('%d',date)`.as("date"),
					sql`sum(sales_document_item.price * sales_document_item.quantity)`.as(
						"sum",
					),
				])
				.groupBy("sales_document.id")
				.withPlugin(new ParseJSONResultsPlugin())
				.execute();

			const currentDay = new Date().getDate().toString();
			console.log(sales_documents[0]?.products);
			return c.json(
				sales_documents.map((d) => ({
					products: d.products.map((el) => ({
						...el,
						place1: el.places[0] || "",
						place2: el.places[1] || "",
						place3: el.places[2] || "",
					})),
					// products:[],
					type: "sale",
					day: currentDay === d.date ? "today" : "yesterday",
					partnerName: d.partnerName,
					partnerId: d.partnerId,
					sum: d.sum || 0,
					comment: "meowe",
				})),
			);
		}
		case "POST:/shop/hs/pos/sell": {
			console.log(json.body.products);
			const document = await db
				.selectFrom("sales_document")
				.selectAll()
				.where("partner_id", "=", json.body.partnerId)
				.orderBy("date", "desc")
				.executeTakeFirst();

			if (document) {
				await db.transaction().execute(async (trx) => {
					await trx
						.insertInto("sales_document_item")
						.values(
							json.body.products.map((p) => ({
								product_id: Number(p.id),
								document_id: document.id,
								price: p.price,
								quantity: p.quantity,
							})),
						)
						.executeTakeFirstOrThrow();

					await trx
						.insertInto("product_stock")
						.values(
							json.body.products.map((p) => ({
								product_id: Number(p.id),
								document_id: document.id,
								quantity: -p.quantity,
								timestamp: new Date().toISOString(),
							})),
						)
						.execute();
				});
			} else {
				return c.text("NO DOC", 500);
			}

			return c.text("success");
		}
		default: {
			break;
		}
	}
	console.log(json);
	return c.text("NOT IMPLEMENTED", 500);
});

export default posRouter;
