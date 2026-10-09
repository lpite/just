/**
 * useDocuments Hook
 * 
 * Fetch and cache documents list
 */

import useSWR from "swr";
import { SalesDocument, IncomeDocument } from "../types";
import * as documentService from "../services/documentService";

type DocumentType = "sales" | "income";

export function useDocuments(type: DocumentType) {
  const { data, error, mutate, isLoading } = useSWR<
    SalesDocument[] | IncomeDocument[]
  >(
    `documents-${type}`,
    () => documentService.listDocuments(type),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    documents: data || [],
    isLoading,
    error,
    mutate,
  };
}
