// @ts-nocheck
import {
  Collections,
  IncomeDocumentItemResponse,
  IncomeDocumentResponse,
  ProductResponse,
  Create,
} from "../../pocketbase-types";
import { pb } from "../utils/pb";

export type ExpandedDocumentItem = Omit<
  IncomeDocumentItemResponse<{
    product: ProductResponse;
  }>,
  "document" | "collectionId" | "collectionName" | "created" | "updated"
>;

export type IncomeDocumentItem = Omit<
  ExpandedDocumentItem,
  "expand" | "product"
> & {
  product: Omit<
    ProductResponse,
    "collectionId" | "collectionName" | "created" | "updated"
  > | null;
  isNew?: boolean;
};

interface IncomeDocument extends IncomeDocumentResponse {
  items: IncomeDocumentItem[];
}

const emptyDocument: IncomeDocumentResponse = {
  id: "",
  collectionId: "",
  collectionName: Collections.IncomeDocument,
  created: "" as any,
  date: new Date().toISOString(),
  posted: false,
  supplier: "",
  warehouse: "",
};

function validateDocument(document: IncomeDocument) {
  if (document.posted && !document.supplier.length) {
    return false;
  }

  if (document.posted && !document.items.length) {
    return false;
  }

  return true;
}

export const IncomeDocument = {
  load: async (id: string) => {
    const document = await pb
      .collection(Collections.IncomeDocument)
      .getOne(id)
      .catch((err) => {
        console.error(err);
        return emptyDocument;
      });

    const documentItems = (await pb
      .collection(Collections.IncomeDocumentItem)
      .getList<ExpandedDocumentItem>(0, 10000, {
        filter: `document="${document?.id}"`,
        expand: "product",
      })
      .then((r) => r.items)
      .catch((err) => {
        console.error(err);
        return [];
      })
      .then((items) =>
        items.map((el) => ({ ...el, product: el.expand.product })),
      )) as IncomeDocumentItem[];

    return {
      ...document,
      items: documentItems,
    };
  },
  save: async (id: string, document: IncomeDocument) => {
    try {
      if (!validateDocument(document)) {
        throw new Error("Не пройшов валідацію");
      }
      const batch = pb.createBatch();

      const currentProductStock = await pb
        .collection(Collections.ProductStock)
        .getFullList({
          filter: `document = '${document.id}' && document_type = 'income'`,
        });

      currentProductStock.forEach((item) => {
        batch.collection(Collections.ProductStock).delete(item.id);
      });

      const currentDocumentItems = await pb
        .collection(Collections.IncomeDocumentItem)
        .getFullList({
          filter: `document='${document.id}'`,
        });

      batch.collection(Collections.IncomeDocument).update(id, document);

      currentDocumentItems.forEach((item) => {
        batch.collection(Collections.IncomeDocumentItem).delete(item.id);
      });

      document.items.forEach((item) => {
        batch.collection(Collections.IncomeDocumentItem).create({
          product: item.product?.id,
          quantity: item.quantity,
          document: document.id,
          price: item.price,
        });
        if (document.posted) {
          batch.collection(Collections.ProductStock).create({
            date: document.date,
            document: document.id,
            document_type: "income",
            product: item.product?.id,
            quantity: item.quantity,
          } as Create<Collections.ProductStock>);
        }
      });

      await batch.send();
      return true;
    } catch (err) {
      alert(err);
      return false;
    }
  },
  create: async (document: IncomeDocument) => {
    try {
      if (!validateDocument(document)) {
        throw new Error("Не пройшов валідацію");
      }
      let documentId = Math.random().toString();
      if ("randomUUID" in crypto) {
        documentId = crypto.randomUUID().replace(/-/g, "");
      }

      const batch = pb.createBatch();
      const {
        items,
        id,
        created,
        collectionId,
        collectionName,
        ...documentNoItems
      } = document;

      batch
        .collection(Collections.IncomeDocument)
        .create({ id: documentId, ...documentNoItems });

      document.items.forEach((item) => {
        batch.collection(Collections.IncomeDocumentItem).create({
          product: item.product?.id,
          quantity: item.quantity,
          document: documentId,
          price: item.price,
        });
        if (document.posted) {
          batch.collection(Collections.ProductStock).create({
            date: document.date,
            document: documentId,
            document_type: "income",
            product: item.product?.id,
            quantity: item.quantity,
          } as Create<Collections.ProductStock>);
        }
      });
      const r = await batch.send();

      return r[0].body.id as string;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
};
