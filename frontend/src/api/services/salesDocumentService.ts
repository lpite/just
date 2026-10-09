/**
 * Sales Document Service
 *
 * Handles all sales document related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../client";
import { SalesDocument, ListResponse } from "../types";

/**
 * List all sales documents
 */
export async function listSalesDocuments(): Promise<SalesDocument[]> {
  const response = await apiGet<ListResponse<SalesDocument>>(
    "/api/sales-documents",
  );
  return response.data || [];
}

/**
 * Get a sales document with items
 */
export async function getSalesDocument(id: number): Promise<SalesDocument> {
  return apiGet<{ data: SalesDocument }>(`/api/sales-documents/${id}`).then(
    (r) => r.data,
  );
}

/**
 * Create a sales document with items
 */
export async function createSalesDocument(data: {
  date?: string;
  partner_id: number;
  items?: Array<{ product_id: number; price: number; quantity: number }>;
}): Promise<SalesDocument> {
  const response = await apiPost<{ data: SalesDocument }>(
    "/api/sales-documents",
    data,
  );
  return response.data!;
}

/**
 * Update a sales document
 */
export async function updateSalesDocument(
  id: number,
  data: { date?: string; partner_id?: number },
): Promise<SalesDocument> {
  const response = await apiPut<{ data: SalesDocument }>(
    `/api/sales-documents/${id}`,
    data,
  );
  return response.data!;
}

/**
 * Post (submit) a sales document
 */
export async function postSalesDocument(id: number): Promise<SalesDocument> {
  const response = await apiPost<{ data: SalesDocument }>(
    `/api/sales-documents/${id}/post`,
    {},
  );
  return response.data!;
}

/**
 * Unpost a sales document
 */
export async function unpostSalesDocument(id: number): Promise<SalesDocument> {
  const response = await apiPost<{ data: SalesDocument }>(
    `/api/sales-documents/${id}/unpost`,
    {},
  );
  return response.data!;
}

/**
 * Delete a sales document
 */
export async function deleteSalesDocument(id: number): Promise<void> {
  await apiDelete(`/api/sales-documents/${id}`);
}
