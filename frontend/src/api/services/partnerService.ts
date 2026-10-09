/**
 * Partner Service
 * 
 * Handles all partner (client/supplier) related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from "../client";
import { Partner, ListResponse } from "../types";

/**
 * List all partners
 */
export async function listPartners(): Promise<Partner[]> {
  const response = await apiGet<ListResponse<Partner>>("/api/partners");
  return response.data || [];
}

/**
 * Get partner by ID
 */
export async function getPartner(id: number): Promise<Partner> {
  return apiGet<Partner>(`/api/partners/${id}`);
}

/**
 * Create a new partner
 */
export async function createPartner(data: { name: string }): Promise<Partner> {
  const response = await apiPost<{ data: Partner }>("/api/partners", data);
  return response.data!;
}

/**
 * Update partner
 */
export async function updatePartner(
  id: number,
  data: { name: string }
): Promise<Partner> {
  const response = await apiPut<{ data: Partner }>(`/api/partners/${id}`, data);
  return response.data!;
}

/**
 * Delete partner
 */
export async function deletePartner(id: number): Promise<void> {
  await apiDelete(`/api/partners/${id}`);
}
