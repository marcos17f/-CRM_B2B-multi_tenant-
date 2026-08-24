import { api } from './client'
import type { Equipment } from './types'

export interface EquipmentPayload {
  companyId: string
  productId?: string
  name: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  purchaseDate?: string
  customFields?: Record<string, unknown>
}

export const equipmentApi = {
  list: (companyId?: string) => api.get<Equipment[]>('/equipment', { params: companyId ? { companyId } : undefined }).then((r) => r.data),
  get: (id: string) => api.get<Equipment>(`/equipment/${id}`).then((r) => r.data),
  create: (payload: EquipmentPayload) => api.post<Equipment>('/equipment', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Omit<EquipmentPayload, 'companyId'>> & { status?: string }) =>
    api.patch<Equipment>(`/equipment/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/equipment/${id}`).then(() => undefined),
}
