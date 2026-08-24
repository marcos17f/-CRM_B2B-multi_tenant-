import { api } from './client'
import type { Campaign, CampaignStatus, CampaignType } from './types'

export interface CampaignPayload {
  name: string
  type: CampaignType
  status?: CampaignStatus
  ownerId?: string
  startsAt?: string
  endsAt?: string
  budget?: number
}

export const campaignsApi = {
  list: () => api.get<Campaign[]>('/campaigns').then((r) => r.data),
  get: (id: string) => api.get<Campaign>(`/campaigns/${id}`).then((r) => r.data),
  create: (payload: CampaignPayload) => api.post<Campaign>('/campaigns', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CampaignPayload>) =>
    api.patch<Campaign>(`/campaigns/${id}`, payload).then((r) => r.data),
}
