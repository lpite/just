// @ts-nocheck
import {
  Collections,
  Create,
  ProductResponse,
  SalesDocumentResponse,
  SalesDocumentItemResponse,
  BrandResponse,
} from "../../pocketbase-types";
import { getProductStock } from "../utils/getProductStock";
import { pb } from "../utils/pb";

type ProductWithBrand = ProductResponse<{ brand: BrandResponse }>;

export type ExpandedDocumentItem = Omit<
  SalesDocumentItemResponse<{
    product: ProductWithBrand;
  }>,
  "document" | "collectionId" | "collectionName" | "created" | "updated"
>;

export type SalesDocumentItem = Omit<
  ExpandedDocumentItem,
  "expand" | "product"
> & {
  product: (ProductResponse & { brand: BrandResponse }) | null;
  isNew?: boolean;
};

interface SalesDocument extends SalesDocumentResponse {
  items: SalesDocumentItem[];
}

const emptyDocument: SalesDocumentResponse = {
  id: "",
  collectionId: "",
  collectionName: Collections.SalesDocument,
  client: "",
  created: "" as any,
  updated: "" as any,
  date: new Date().toISOString(),
  posted: false,
  sum: 0,
  comment: "",
};

async function validateDocument(document: SalesDocument) {
  console.log(document);
  if (document.posted && !document.client.length) {
    return { error: "Клієнт не заповнений." };
  }

  if (document.posted && !document.items.length) {
    return { error: "Немає товарів." };
  }

  const documentItemsStock = await pb
    .collection(Collections.ProductStock)
    .getFullList({
      filter: `document = '${document.id}' && document_type = 'sales'`,
    });

  if (document.posted) {
    const prevItemsQuantity = documentItemsStock.reduce(
      (acc, c) => {
        const prev = acc[c.product];
        if (prev) {
          return { ...acc, [c.product]: prev + c.quantity };
        }
        return { ...acc, [c.product]: c.quantity };
      },

      {} as Record<string, number>,
    );

    const currentItemsQuantity = document.items.reduce(
      (p, c) => {
        if (!c.product?.id) {
          return p;
        }
        if (p[c.product?.id]) {
          return {
            ...p,
            [c.product?.id]: p[c.product.id] + c.quantity,
          };
        }
        return { ...p, [c.product?.id]: c.quantity };
      },
      {} as Record<string, number>,
    );

    for (const [id, quantity] of Object.entries(currentItemsQuantity)) {
      //TODO fetch stocks in one request
      const productStock = await getProductStock(id, new Date());
      const prevItemQuantity = prevItemsQuantity[id] || 0;
      console.log(productStock, prevItemQuantity);
      if (productStock - quantity + Math.abs(prevItemQuantity) < 0) {
        return { error: `Недостатня кількість товару ${id}` };
      }
    }
  }
  return { success: true };
}

export const SalesDocument = {
  load: async (id: string) => {
    const document = await pb
      .collection(Collections.SalesDocument)
      .getOne(id)
      .catch((err) => {
        console.error(err);
        return emptyDocument;
      });

    const documentItems = (await pb
      .collection(Collections.SalesDocumentItem)
      .getList<ExpandedDocumentItem>(0, 200, {
        filter: `document="${document?.id}"`,
        expand: "product,product.brand",
      })
      .then((r) => r.items)
      .catch((err) => {
        console.error(err);
        return [];
      })
      .then((items) =>
        items.map((el) => ({
          ...el,
          product: {
            ...el.expand.product,
            brand: el.expand.product.expand.brand,
          },
        })),
      )) as SalesDocumentItem[];

    return {
      ...document,
      items: documentItems,
    };
  },
  save: async (id: string, document: SalesDocument) => {
    try {
      const validationResult = await validateDocument(document);
      if (validationResult.error) {
        throw new Error(validationResult.error);
      }

      const batch = pb.createBatch();

      const documentItemsStock = await pb
        .collection(Collections.ProductStock)
        .getFullList({
          filter: `document = '${document.id}' && document_type = 'sales'`,
        });

      documentItemsStock.forEach((item) => {
        batch.collection(Collections.ProductStock).delete(item.id);
      });

      const prevDocumentItems = await pb
        .collection(Collections.SalesDocumentItem)
        .getFullList({
          filter: `document='${document.id}'`,
        });

      batch.collection(Collections.SalesDocument).update(id, document);

      //TODO напевно це не класно в ідеалі б звичайно не видаляти всі.
      prevDocumentItems.forEach((item) => {
        batch.collection(Collections.SalesDocumentItem).delete(item.id);
      });

      for (const item of document.items) {
        batch.collection(Collections.SalesDocumentItem).create({
          product: item.product?.id,
          quantity: item.quantity,
          document: document.id,
          price: item.price,
        });

        if (document.posted) {
          if (!item.product?.id) {
            return;
          }

          batch.collection(Collections.ProductStock).create({
            date: document.date,
            document: document.id,
            document_type: "sales",
            product: item.product?.id,
            quantity: -item.quantity,
          } as Create<Collections.ProductStock>);
        }
      }

      await batch.send();
      return true;
    } catch (err) {
      alert(err);
      return false;
    }
  },
  create: async (document: SalesDocument) => {
    try {
      const validationResult = await validateDocument(document);
      console.log(validationResult);
      if (validationResult.error) {
        throw new Error(validationResult.error);
      }

      const batch = pb.createBatch();
      const documentId = crypto.randomUUID().replace(/-/g, "");

      const {
        items,
        id,
        created,
        collectionId,
        collectionName,
        ...documentNoItems
      } = document;

      batch
        .collection(Collections.SalesDocument)
        .create({ id: documentId, ...documentNoItems });

      for (const item of document.items) {
        batch.collection(Collections.SalesDocumentItem).create({
          product: item.product?.id,
          quantity: item.quantity,
          document: documentId,
          price: item.price,
        });
        if (document.posted) {
          if (!item.product?.id) {
            return;
          }

          batch.collection(Collections.ProductStock).create({
            date: document.date,
            document: documentId,
            document_type: "sales",
            product: item.product?.id,
            quantity: -item.quantity,
          } as Create<Collections.ProductStock>);
        }
      }

      await batch.send();
      return documentId;
    } catch (err) {
      console.error(err);
      alert(err);
      return false;
    }
  },
};
