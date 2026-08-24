import { api } from './client'
import type { Segment, SegmentMember, SegmentType } from './types'

export interface SegmentPayload {
  name: string
  type: SegmentType
  criteria?: Record<string, unknown>
}

export const segmentsApi = {
  list: () => api.get<Segment[]>('/segments').then((r) => r.data),
  get: (id: string) => api.get<Segment>(`/segments/${id}`).then((r) => r.data),
  create: (payload: SegmentPayload) => api.post<Segment>('/segments', payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/segments/${id}`).then(() => undefined),
  listMembers: (id: string) => api.get<SegmentMember[]>(`/segments/${id}/members`).then((r) => r.data),
  addMember: (id: string, companyId: string) =>
    api.post(`/segments/${id}/members`, { companyId }).then(() => undefined),
  removeMember: (id: string, companyId: string) =>
    api.delete(`/segments/${id}/members/${companyId}`).then(() => undefined),
  recompute: (id: string) => api.post<{ segmentId: string; memberCount: number }>(`/segments/${id}/recompute`).then((r) => r.data),
}
