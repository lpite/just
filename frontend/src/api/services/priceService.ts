import { apiGet } from "../client";
import { ProductPrice, ListResponse } from "../types";

export async function getProductPriceHistory(
  productId: number,
): Promise<ProductPrice[]> {
  const response = await apiGet<ListResponse<ProductPrice>>(
    `/api/product-price/history/product/${productId}`,
  );
  return response.data || [];
}