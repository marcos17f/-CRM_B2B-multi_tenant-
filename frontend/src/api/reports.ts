import { api } from './client'
import type { MessagingMetrics, RfmRow, RfmSnapshot, SeasonalityRow, TopCustomersResult } from './types'

export interface RfmListFilters {
  segment?: string
  sortBy?: 'recency' | 'frequency' | 'monetary' | 'name'
  order?: 'asc' | 'desc'
}

export const reportsApi = {
  listRfm: (filters: RfmListFilters = {}) =>
    api.get<RfmRow[]>('/reports/rfm', { params: filters }).then((r) => r.data),
  recomputeRfm: (periodMonths?: number) =>
    api.post('/reports/rfm/recompute', periodMonths ? { periodMonths } : {}).then((r) => r.data),
  companyRfmHistory: (companyId: string) =>
    api.get<RfmSnapshot[]>(`/companies/${companyId}/rfm`).then((r) => r.data),
  topCustomers: (limit = 20, lifetime = false) =>
    api.get<TopCustomersResult>('/reports/top-customers', { params: { limit, lifetime } }).then((r) => r.data),
  seasonality: () => api.get<SeasonalityRow[]>('/reports/seasonality').then((r) => r.data),
  messaging: (from: Date, to: Date) =>
    api.get<MessagingMetrics>('/reports/messaging', { params: { from: from.toISOString(), to: to.toISOString() } }).then((r) => r.data),
}
