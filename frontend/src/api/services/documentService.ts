/**
 * Document Service
 *
 * Generic, type-based helpers for working with sales and income documents.
 * Document-specific calls live in salesDocumentService and incomeDocumentService.
 */

import { SalesDocument, IncomeDocument } from "../types";
import * as salesDocumentService from "./salesDocumentService";
import * as incomeDocumentService from "./incomeDocumentService";

export * from "./salesDocumentService";
export * from "./incomeDocumentService";

export type DocumentType = "sales" | "income";

/**
 * Get list of documents by type
 */
export async function listDocuments(
  type: DocumentType,
): Promise<SalesDocument[] | IncomeDocument[]> {
  if (type === "sales") {
    return salesDocumentService.listSalesDocuments();
  } else {
    return incomeDocumentService.listIncomeDocuments();
  }
}

/**
 * Get a single document by type and ID
 */
export async function getDocument(
  type: DocumentType,
  id: number,
): Promise<SalesDocument | IncomeDocument> {
  if (type === "sales") {
    return salesDocumentService.getSalesDocument(id);
  } else {
    return incomeDocumentService.getIncomeDocument(id);
  }
}

/**
 * Create a document by type
 */
export async function createDocument(
  type: DocumentType,
  data: {
    date?: string;
    partner_id: number;
    items?: Array<{ product_id: number; price: number; quantity: number }>;
  },
): Promise<SalesDocument | IncomeDocument> {
  if (type === "sales") {
    return salesDocumentService.createSalesDocument(data);
  } else {
    return incomeDocumentService.createIncomeDocument(data);
  }
}

/**
 * Post a document by type
 */
export async function postDocument(
  type: DocumentType,
  id: number,
): Promise<SalesDocument | IncomeDocument> {
  if (type === "sales") {
    return salesDocumentService.postSalesDocument(id);
  } else {
    return incomeDocumentService.postIncomeDocument(id);
  }
}

/**
 * Delete a document by type
 */
export async function deleteDocument(
  type: DocumentType,
  id: number,
): Promise<void> {
  if (type === "sales") {
    return salesDocumentService.deleteSalesDocument(id);
  } else {
    return incomeDocumentService.deleteIncomeDocument(id);
  }
}
