/**
 * useDocumentMutations Hook
 *
 * Handle document create/update/delete/post operations
 */

import { useState } from "react";
import { SalesDocument, IncomeDocument } from "../types";
import * as documentService from "../services/documentService";

type DocumentType = "sales" | "income";

interface MutationState {
  isLoading: boolean;
  error: Error | null;
}

export function useDocumentMutations() {
  const [createState, setCreateState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });
  const [updateState, setUpdateState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });
  const [postState, setPostState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });
  const [deleteState, setDeleteState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });
  const [unpostState, setUnpostState] = useState<MutationState>({
    isLoading: false,
    error: null,
  });

  const create = async (
    type: DocumentType,
    data: {
      date?: string;
      partner_id: number;
      items?: Array<{ product_id: number; price: number; quantity: number }>;
    },
  ): Promise<SalesDocument | IncomeDocument> => {
    setCreateState({ isLoading: true, error: null });
    try {
      const result = await documentService.createDocument(type, data);
      setCreateState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setCreateState({ isLoading: false, error: err });
      throw err;
    }
  };

  const update = async (
    type: DocumentType,
    id: number,
    data: {
      date?: string;
      partner_id?: number;
      items?: Array<{ product_id: number; price: number; quantity: number }>;
    },
  ): Promise<SalesDocument | IncomeDocument> => {
    setUpdateState({ isLoading: true, error: null });
    try {
      let result: SalesDocument | IncomeDocument;
      if (type === "sales") {
        result = await documentService.updateSalesDocument(id, data);
      } else {
        result = await documentService.updateIncomeDocument(id, data);
      }
      setUpdateState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setUpdateState({ isLoading: false, error: err });
      throw err;
    }
  };

  const post = async (
    type: DocumentType,
    id: number,
  ): Promise<SalesDocument | IncomeDocument> => {
    setPostState({ isLoading: true, error: null });
    try {
      const result = await documentService.postDocument(type, id);
      setPostState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setPostState({ isLoading: false, error: err });
      throw err;
    }
  };

  const remove = async (type: DocumentType, id: number): Promise<void> => {
    setDeleteState({ isLoading: true, error: null });
    try {
      await documentService.deleteDocument(type, id);
      setDeleteState({ isLoading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setDeleteState({ isLoading: false, error: err });
      throw err;
    }
  };

  const unpost = async (
    type: DocumentType,
    id: number,
  ): Promise<SalesDocument | IncomeDocument> => {
    setUnpostState({ isLoading: true, error: null });
    try {
      let result: SalesDocument | IncomeDocument;
      if (type === "sales") {
        result = await documentService.unpostSalesDocument(id);
      } else {
        result = await documentService.unpostIncomeDocument(id);
      }
      setUnpostState({ isLoading: false, error: null });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setUnpostState({ isLoading: false, error: err });
      throw err;
    }
  };

  return {
    create: { execute: create, ...createState },
    update: { execute: update, ...updateState },
    post: { execute: post, ...postState },
    unpost: { execute: unpost, ...unpostState },
    delete: { execute: remove, ...deleteState },
  };
}
