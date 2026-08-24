import { api } from './client'
import type { Opportunity, OpportunityType, RiskLevel } from './types'

export interface OpportunityFilters {
  pipelineId?: string
  stageId?: string
  ownerId?: string
  status?: string
}

export interface CreateOpportunityPayload {
  name: string
  companyId: string
  primaryContactId?: string
  pipelineId: string
  stageId: string
  type?: OpportunityType
  amount?: number
  currency?: string
  sourceCampaignId?: string
  ownerId?: string
  expectedCloseDate?: string
  season?: string
  cropType?: string
}

export interface UpdateOpportunityPayload {
  name?: string
  primaryContactId?: string
  amount?: number
  currency?: string
  ownerId?: string
  type?: OpportunityType
  riskLevel?: RiskLevel
  expectedCloseDate?: string
  season?: string
  cropType?: string
}

export const opportunitiesApi = {
  list: (filters: OpportunityFilters = {}) =>
    api.get<Opportunity[]>('/opportunities', { params: filters }).then((r) => r.data),
  get: (id: string) => api.get<Opportunity>(`/opportunities/${id}`).then((r) => r.data),
  create: (payload: CreateOpportunityPayload) => api.post<Opportunity>('/opportunities', payload).then((r) => r.data),
  update: (id: string, payload: UpdateOpportunityPayload) =>
    api.patch<Opportunity>(`/opportunities/${id}`, payload).then((r) => r.data),
  moveStage: (id: string, stageId: string, lostReason?: string) =>
    api.post<Opportunity>(`/opportunities/${id}/move-stage`, { stageId, lostReason }).then((r) => r.data),
  reopen: (id: string, stageId: string) =>
    api.post<Opportunity>(`/opportunities/${id}/reopen`, { stageId }).then((r) => r.data),
}
