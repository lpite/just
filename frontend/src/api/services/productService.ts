/**
 * Product Service
 *
 * Handles all product-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from "../client";
import { API_BASE_URL } from "../client";
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

// ============================================================================
// Product photos
// ============================================================================

export interface ProductPhoto {
  id?: number;
  product_id?: number;
  photo: string;
  url?: string;
}

/**
 * Build a servable URL for a stored photo path.
 */
export function getProductPhotoUrl(photo: string): string {
  return `${API_BASE_URL}/api/product-photos/file?photo=${encodeURIComponent(
    photo,
  )}`;
}

/**
 * List photos of a product
 */
export async function listProductPhotos(productId: number): Promise<ProductPhoto[]> {
  const response = await apiGet<ListResponse<ProductPhoto>>(
    `/api/product-photos/product/${productId}`,
  );
  return response.data || [];
}

/**
 * Upload a photo for a product
 */
export async function uploadProductPhoto(
  productId: number,
  file: File,
): Promise<ProductPhoto> {
  const formData = new FormData();
  formData.append("product_id", String(productId));
  formData.append("photo", file);
  const response = await apiUpload<{ data: ProductPhoto }>(
    "/api/product-photos",
    formData,
  );
  return response.data!;
}

/**
 * Delete a photo from a product by its stored path
 */
export async function deleteProductPhoto(
  productId: number,
  photo: string,
): Promise<void> {
  await apiDelete(
    `/api/product-photos?product_id=${productId}&photo=${encodeURIComponent(photo)}`,
  );
}
