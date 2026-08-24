import { api } from './client'
import type { Pipeline } from './types'

export const pipelinesApi = {
  list: () => api.get<Pipeline[]>('/pipelines').then((r) => r.data),
  get: (id: string) => api.get<Pipeline>(`/pipelines/${id}`).then((r) => r.data),
}
