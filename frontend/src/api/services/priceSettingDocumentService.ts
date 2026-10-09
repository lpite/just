/**
 * Price Setting Document Service
 *
 * Handles all price setting document related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../client";
import { PriceSettingDocument, ListResponse } from "../types";

/**
 * List all price setting documents
 */
export async function listPriceSettingDocuments(): Promise<
  PriceSettingDocument[]
> {
  const response = await apiGet<ListResponse<PriceSettingDocument>>(
    "/api/price-setting-documents",
  );
  return response.data || [];
}

/**
 * Get a price setting document with items
 */
export async function getPriceSettingDocument(
  id: number,
): Promise<PriceSettingDocument> {
  return apiGet<{ data: PriceSettingDocument }>(
    `/api/price-setting-documents/${id}`,
  ).then((r) => r.data);
}

/**
 * Create a price setting document with items
 */
export async function createPriceSettingDocument(data: {
  date?: string;
  items?: Array<{ product_id: number; price: number }>;
}): Promise<PriceSettingDocument> {
  const response = await apiPost<{ data: PriceSettingDocument }>(
    "/api/price-setting-documents",
    data,
  );
  return response.data!;
}

/**
 * Update a price setting document
 */
export async function updatePriceSettingDocument(
  id: number,
  data: {
    date?: string;
    items?: Array<{ product_id: number; price: number }>;
  },
): Promise<PriceSettingDocument> {
  const response = await apiPut<{ data: PriceSettingDocument }>(
    `/api/price-setting-documents/${id}`,
    data,
  );
  return response.data!;
}

/**
 * Post (submit) a price setting document
 */
export async function postPriceSettingDocument(
  id: number,
): Promise<PriceSettingDocument> {
  const response = await apiPost<{ data: PriceSettingDocument }>(
    `/api/price-setting-documents/${id}/post`,
    {},
  );
  return response.data!;
}

/**
 * Unpost a price setting document
 */
export async function unpostPriceSettingDocument(
  id: number,
): Promise<PriceSettingDocument> {
  const response = await apiDelete<{ data: PriceSettingDocument }>(
    `/api/price-setting-documents/${id}/post`,
  );
  return response.data!;
}

/**
 * Delete a price setting document
 */
export async function deletePriceSettingDocument(id: number): Promise<void> {
  await apiDelete(`/api/price-setting-documents/${id}`);
}
