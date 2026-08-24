import { api } from './client'
import type { ServiceOrder, ServiceOrderPart, ServiceOrderType } from './types'

export interface ServiceOrderPayload {
  companyId: string
  contactId?: string
  equipmentId?: string
  type?: ServiceOrderType
  description?: string
  technicianId?: string
  scheduledDate?: string
}

export interface ServiceOrderFilters {
  companyId?: string
  status?: string
  technicianId?: string
}

export const serviceOrdersApi = {
  list: (filters: ServiceOrderFilters = {}) => api.get<ServiceOrder[]>('/service-orders', { params: filters }).then((r) => r.data),
  get: (id: string) => api.get<ServiceOrder>(`/service-orders/${id}`).then((r) => r.data),
  create: (payload: ServiceOrderPayload) => api.post<ServiceOrder>('/service-orders', payload).then((r) => r.data),
  update: (id: string, payload: Partial<Omit<ServiceOrderPayload, 'companyId'>>) =>
    api.patch<ServiceOrder>(`/service-orders/${id}`, payload).then((r) => r.data),
  start: (id: string) => api.post<ServiceOrder>(`/service-orders/${id}/start`).then((r) => r.data),
  complete: (id: string) => api.post<ServiceOrder>(`/service-orders/${id}/complete`).then((r) => r.data),
  cancel: (id: string) => api.post<ServiceOrder>(`/service-orders/${id}/cancel`).then((r) => r.data),
  listParts: (id: string) => api.get<ServiceOrderPart[]>(`/service-orders/${id}/parts`).then((r) => r.data),
  addPart: (id: string, payload: { productId: string; description?: string; quantity: number; unitPrice?: number }) =>
    api.post<ServiceOrderPart>(`/service-orders/${id}/parts`, payload).then((r) => r.data),
  removePart: (id: string, partId: string) => api.delete(`/service-orders/${id}/parts/${partId}`).then(() => undefined),
}
