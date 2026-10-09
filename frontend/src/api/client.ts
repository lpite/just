/**
 * API Client Configuration
 *
 * Single source of truth for backend API communication.
 * Handles URL configuration, error handling, and request/response normalization.
 */

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // In development, backend runs on localhost:3000
  // In production, use relative path (same domain as frontend)
  if (typeof window !== "undefined") {
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isDevelopment) {
      return "http://localhost:3000";
      // return "http://192.168.0.106:3000";
      // return "http://192.168.50.190:3000";
    }
  }

  // Production: use relative path (same domain)
  return "/api";
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Standard API response envelope
 * Matches backend response format: { "data": {...} } or { "error": "..." }
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * List response (from backend: { "data": [...], "count": <n> })
 */
export interface ListResponse<T> {
  data: T[];
  count: number;
}

/**
 * Fetch wrapper with error handling
 */
async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : "/" + path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type");
    let data: any;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Check for API errors
    if (!response.ok) {
      const errorMessage = data?.error || data || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return data as T;
  } catch (error) {
    console.error(`API Error [${options.method || "GET"} ${path}]:`, error);
    throw error;
  }
}

/**
 * GET request
 */
export async function apiGet<T>(path: string): Promise<T> {
  return apiCall<T>(path, { method: "GET" });
}

/**
 * POST request
 */
export async function apiPost<T>(path: string, data: any): Promise<T> {
  return apiCall<T>(path, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(path: string, data: any): Promise<T> {
  return apiCall<T>(path, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(path: string, data: any): Promise<T> {
  return apiCall<T>(path, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(path: string): Promise<T> {
  return apiCall<T>(path, { method: "DELETE" });
}

/**
 * Build query string from parameters
 */
export function buildQueryString(params: Record<string, any>): string {
  const filtered = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );

  return filtered.length > 0 ? "?" + filtered.join("&") : "";
}
