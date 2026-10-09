/**
 * useProductMutations Hook
 * 
 * Handle product create/update/delete operations
 */

import { useState } from "react";
import { Product } from "../types";
import * as productService from "../services/productService";

interface MutationState {
  isLoading: boolean;
  error: Error | null;
}

export function useProductMutations() {
  const [createState, setCreateState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });
  const [updateState, setUpdateState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });
  const [deleteState, setDeleteState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const create = async (data: {
    name: string;
    nameAlt?: string;
    oem?: string;
    article?: string;
    description?: string;
    brand?: string;
    units?: string;
    places?: string;
    photos?: string;
  }): Promise<Product> => {
    setCreateState({ isLoading: true, error: null });
    try {
      const result = await productService.createProduct(data);
      setCreateState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setCreateState({ isLoading: false, error: err });
      throw err;
    }
  };

  const update = async (id: number, data: Partial<Product>): Promise<Product> => {
    setUpdateState({ isLoading: true, error: null });
    try {
      const result = await productService.updateProduct(id, data);
      setUpdateState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setUpdateState({ isLoading: false, error: err });
      throw err;
    }
  };

  const remove = async (id: number): Promise<void> => {
    setDeleteState({ isLoading: true, error: null });
    try {
      await productService.deleteProduct(id);
      setDeleteState({ isLoading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setDeleteState({ isLoading: false, error: err });
      throw err;
    }
  };

  return {
    create: { execute: create, ...createState },
    update: { execute: update, ...updateState },
    delete: { execute: remove, ...deleteState },
  };
}
