import { api } from './client'
import type { Activity, ManualActivityType, RelatedToType } from './types'

export interface CreateActivityPayload {
  type: ManualActivityType
  relatedToType: RelatedToType
  relatedToId: string
  payload?: Record<string, unknown>
}

export const activitiesApi = {
  listForEntity: (relatedToType: RelatedToType, relatedToId: string) =>
    api.get<Activity[]>('/activities', { params: { relatedToType, relatedToId } }).then((r) => r.data),
  create: (payload: CreateActivityPayload) => api.post<Activity>('/activities', payload).then((r) => r.data),
  listRecent: (limit = 20) => api.get<Activity[]>('/activities/recent', { params: { limit } }).then((r) => r.data),
}
