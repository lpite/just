/**
 * useProducts Hook
 * 
 * Fetch and cache products list
 */

import useSWR from "swr";
import { Product } from "../types";
import * as productService from "../services/productService";

export function useProducts() {
  const { data, error, mutate, isLoading } = useSWR<Product[]>(
    "products",
    () => productService.listProducts(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    products: data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useProduct(id: number) {
  const { data, error, mutate, isLoading } = useSWR<Product>(
    id ? `product-${id}` : null,
    id ? () => productService.getProduct(id) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    product: data,
    isLoading,
    error,
    mutate,
  };
}

export function useProductSearch(query: string) {
  const { data, error, mutate, isLoading } = useSWR(
    query ? `search-${query}` : null,
    query ? () => productService.searchProducts(query) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000,
    }
  );

  return {
    results: data || [],
    isLoading,
    error,
    mutate,
  };
}
