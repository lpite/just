/**
 * Stock Service
 * 
 * Handles product stock tracking
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../client";
import { ProductStock, StockEntry, ListResponse } from "../types";

/**
 * Get aggregated stock for all products for a given date
 */
export async function getAggregatedStock(date?: string): Promise<{
  data: ProductStock[];
  date: string;
  count: number;
}> {
  const params = date ? `?date=${date}` : "";
  return apiGet(`/api/product-stock${params}`);
}

/**
 * Get aggregated stock for a single product
 */
export async function getProductStock(
  productId: number,
  date?: string
): Promise<number> {
  const params = date ? `?date=${date}` : "";
  const response = await apiGet<ProductStock>(
    `/api/product-stock/product/${productId}${params}`
  );
  return response.quantity || 0;
}

/**
 * Get all raw stock entries
 */
export async function getStockHistoryAll(): Promise<StockEntry[]> {
  const response = await apiGet<ListResponse<StockEntry>>(
    "/api/product-stock/history/all"
  );
  return response.data || [];
}

/**
 * Get raw stock entries for a product
 */
export async function getProductStockHistory(
  productId: number
): Promise<StockEntry[]> {
  const response = await apiGet<ListResponse<StockEntry>>(
    `/api/product-stock/history/product/${productId}`
  );
  return response.data || [];
}

/**
 * Get a single stock entry
 */
export async function getStockEntry(id: number): Promise<StockEntry> {
  return apiGet<StockEntry>(`/api/product-stock/${id}`);
}

/**
 * Create a stock entry
 */
export async function createStockEntry(data: {
  product_id: number;
  quantity: number;
  document_id?: number;
}): Promise<StockEntry> {
  const response = await apiPost<{ data: StockEntry }>(
    "/api/product-stock",
    data
  );
  return response.data!;
}

/**
 * Update a stock entry
 */
export async function updateStockEntry(
  id: number,
  data: { quantity: number }
): Promise<StockEntry> {
  const response = await apiPut<{ data: StockEntry }>(
    `/api/product-stock/${id}`,
    data
  );
  return response.data!;
}

/**
 * Delete a stock entry
 */
export async function deleteStockEntry(id: number): Promise<void> {
  await apiDelete(`/api/product-stock/${id}`);
}
