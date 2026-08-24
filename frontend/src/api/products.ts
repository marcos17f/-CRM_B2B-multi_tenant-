import { api } from './client'
import type { InventoryMovement, Product, ProductCategory } from './types'

export interface ProductPayload {
  sku: string
  name: string
  category: ProductCategory
  unit?: string
  price?: number
  trackStock?: boolean
  stockQuantity?: number
  customFields?: Record<string, unknown>
}

export const productsApi = {
  list: (category?: string) => api.get<Product[]>('/products', { params: category ? { category } : undefined }).then((r) => r.data),
  get: (id: string) => api.get<Product>(`/products/${id}`).then((r) => r.data),
  create: (payload: ProductPayload) => api.post<Product>('/products', payload).then((r) => r.data),
  update: (id: string, payload: Partial<ProductPayload> & { status?: string }) =>
    api.patch<Product>(`/products/${id}`, payload).then((r) => r.data),
  listMovements: (id: string) => api.get<InventoryMovement[]>(`/products/${id}/movements`).then((r) => r.data),
  adjustStock: (id: string, quantityDelta: number, type: 'adjustment' | 'restock', note?: string) =>
    api.post<Product>(`/products/${id}/movements`, { quantityDelta, type, note }).then((r) => r.data),
}
