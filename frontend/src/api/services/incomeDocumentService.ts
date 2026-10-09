/**
 * Income Document Service
 *
 * Handles all income document related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../client";
import { IncomeDocument, ListResponse } from "../types";

/**
 * List all income documents
 */
export async function listIncomeDocuments(): Promise<IncomeDocument[]> {
  const response = await apiGet<ListResponse<IncomeDocument>>(
    "/api/income-documents",
  );
  return response.data || [];
}

/**
 * Get an income document with items
 */
export async function getIncomeDocument(id: number): Promise<IncomeDocument> {
  return apiGet<{ data: IncomeDocument }>(`/api/income-documents/${id}`).then(
    (r) => r.data,
  );
}

/**
 * Create an income document with items
 */
export async function createIncomeDocument(data: {
  date?: string;
  partner_id: number;
  items?: Array<{ product_id: number; price: number; quantity: number }>;
}): Promise<IncomeDocument> {
  const response = await apiPost<{ data: IncomeDocument }>(
    "/api/income-documents",
    data,
  );
  return response.data!;
}

/**
 * Update an income document
 */
export async function updateIncomeDocument(
  id: number,
  data: {
    date?: string;
    partner_id?: number;
    items?: Array<{ product_id: number; price: number; quantity: number }>;
  },
): Promise<IncomeDocument> {
  const response = await apiPut<{ data: IncomeDocument }>(
    `/api/income-documents/${id}`,
    data,
  );
  return response.data!;
}

/**
 * Post (submit) an income document
 */
export async function postIncomeDocument(id: number): Promise<IncomeDocument> {
  const response = await apiPost<{ data: IncomeDocument }>(
    `/api/income-documents/${id}/post`,
    {},
  );
  return response.data!;
}

/**
 * Unpost an income document
 */
export async function unpostIncomeDocument(
  id: number,
): Promise<IncomeDocument> {
  const response = await apiPost<{ data: IncomeDocument }>(
    `/api/income-documents/${id}/unpost`,
    {},
  );
  return response.data!;
}

/**
 * Delete an income document
 */
export async function deleteIncomeDocument(id: number): Promise<void> {
  await apiDelete(`/api/income-documents/${id}`);
}
