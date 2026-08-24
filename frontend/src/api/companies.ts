import { api } from './client'
import type { Company } from './types'

export interface CompanyPayload {
  name: string
  domain?: string
  industry?: string
  employeeCount?: number
  annualRevenue?: number
  status?: string
  ownerId?: string
  customFields?: Record<string, unknown>
}

export const companiesApi = {
  list: () => api.get<Company[]>('/companies').then((r) => r.data),
  get: (id: string) => api.get<Company>(`/companies/${id}`).then((r) => r.data),
  create: (payload: CompanyPayload) => api.post<Company>('/companies', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CompanyPayload>) =>
    api.patch<Company>(`/companies/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/companies/${id}`).then(() => undefined),
}
