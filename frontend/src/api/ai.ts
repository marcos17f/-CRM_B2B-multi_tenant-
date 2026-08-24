import { api } from './client'
import type { RelatedToType } from './types'

export type AiSuggestionKind = 'suggestion' | 'approval'
export type AiSuggestionSeverity = 'normal' | 'critical'
export type AiSuggestionStatus = 'pending' | 'approved' | 'dismissed'

export interface AiSuggestion {
  id: string
  workspaceId: string
  kind: AiSuggestionKind
  ruleKey: string
  relatedToType: RelatedToType
  relatedToId: string
  severity: AiSuggestionSeverity
  title: string
  description: string
  payload: Record<string, unknown>
  status: AiSuggestionStatus
  createdAt: string
  resolvedAt: string | null
}

export const aiApi = {
  list: () => api.get<AiSuggestion[]>('/ai/suggestions').then((r) => r.data),
  dismiss: (id: string) => api.post<AiSuggestion>(`/ai/suggestions/${id}/dismiss`).then((r) => r.data),
  approve: (id: string) => api.post<AiSuggestion>(`/ai/suggestions/${id}/approve`).then((r) => r.data),
}
