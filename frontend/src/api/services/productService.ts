/**
 * Product Service
 *
 * Handles all product-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../client";
import { Product, SearchResult, ListResponse } from "../types";

/**
 * List all products
 */
export async function listProducts(): Promise<Product[]> {
  const response = await apiGet<ListResponse<Product>>("/api/products");
  return response.data || [];
}

/**
 * Get product by ID
 */
export async function getProduct(id: number): Promise<Product> {
  return apiGet<{ data: Product }>(`/api/products/${id}`).then((r) => r.data);
}

/**
 * Create a new product
 */
export async function createProduct(data: {
  name: string;
  nameAlt?: string;
  oem?: string;
  article?: string;
  description?: string;
  brand?: string;
  units?: string;
  places?: string;
  photos?: string;
}): Promise<Product> {
  const response = await apiPost<{ data: Product }>("/api/products", data);
  return response.data!;
}

/**
 * Update product
 */
export async function updateProduct(
  id: number,
  data: Partial<Product>,
): Promise<Product> {
  const response = await apiPut<{ data: Product }>(`/api/products/${id}`, data);
  return response.data!;
}

/**
 * Delete product
 */
export async function deleteProduct(id: number): Promise<void> {
  await apiDelete(`/api/products/${id}`);
}

/**
 * Search products by query string
 */
export async function searchProducts(query: string): Promise<SearchResult[]> {
  const response = await apiGet<SearchResult[]>(
    `/search?q=${encodeURIComponent(query)}`,
  );
  return response || [];
}
