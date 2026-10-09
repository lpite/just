import * as stockService from "../api/services/stockService";

export async function getProductStock(id: string | number, date?: Date) {
  const productId = typeof id === "string" ? Number(id) : id;
  return await stockService.getProductStock(productId, date?.toISOString().split('T')[0]);
}
