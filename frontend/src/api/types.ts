/**
 * API Types
 *
 * Aligned with backend API.md specification
 */

// ============================================================================
// Products
// ============================================================================

export interface Product {
  id: number;
  name: string;
  nameAlt?: string;
  oem?: string;
  article?: string;
  description?: string;
  brand?: string;
  units?: string;
  places?: string; // JSON array string, e.g. ["A-1","B-2"]
  photos?: string; // JSON array string of photo paths
}

// ============================================================================
// Partners
// ============================================================================

export interface Partner {
  id: number;
  name: string;
}

// ============================================================================
// Sales Documents
// ============================================================================

export interface SalesDocument {
  id: number;
  date: string;
  partner_id: number;
  posted: boolean | number;
  items?: SalesDocumentItem[];
}

export interface SalesDocumentItem {
  id: number;
  document_id: number;
  product_id: number;
  product: { name: string; article: string };
  price: number;
  quantity: number;
  created_at: string;
}

// ============================================================================
// Income Documents
// ============================================================================

export interface IncomeDocument {
  id: number;
  date: string;
  partner_id: number;
  posted: boolean | number;
  items?: IncomeDocumentItem[];
}

export interface IncomeDocumentItem {
  id: number;
  document_id: number;
  product_id: number;
  product: { name: string; article: string };
  price: number;
  quantity: number;
  created_at: string;
}

// ============================================================================
// Stock
// ============================================================================

export interface ProductStock {
  product_id: number;
  quantity: number;
}

export interface StockEntry {
  id: number;
  product_id: number;
  quantity: number;
  document_id?: number;
  document_type?: "sales" | "income" | null;
  timestamp: string;
}

// ============================================================================
// Prices
// ============================================================================

export interface ProductPrice {
  id: number;
  product_id: number;
  price: number;
  timestamp: string;
}

export interface PriceSettingDocument {
  id: number;
  date: string;
  posted: boolean | number;
  items?: PriceSettingDocumentItem[];
}

export interface PriceSettingDocumentItem {
  id: number;
  document_id: number;
  product_id: number;
  price: number;
}

// ============================================================================
// Search
// ============================================================================

export interface SearchResult {
  id: string;
  name: string;
  article?: string;
  oem?: string;
  brand?: string;
  places?: string[];
  photoUrl?: string;
  quantity: number;
  price: number;
  foundBy?: string;
}

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  data: T[];
  count: number;
}
