/**
 * useDocument Hook
 * 
 * Fetch and cache a single document
 */

import useSWR from "swr";
import { SalesDocument, IncomeDocument } from "../types";
import * as documentService from "../services/documentService";

type DocumentType = "sales" | "income";

export function useDocument(type: DocumentType, id: number) {
  const { data, error, mutate, isLoading } = useSWR<
    SalesDocument | IncomeDocument
  >(
    id ? `document-${type}-${id}` : null,
    id ? () => documentService.getDocument(type, id) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    document: data,
    isLoading,
    error,
    mutate,
  };
}
