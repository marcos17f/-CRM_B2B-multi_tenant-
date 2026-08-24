import { api } from './client'
import type { AiSettings } from './types'

export interface UpdateAiSettingsPayload {
  enabled?: boolean
  agentEnabled?: boolean
  apiKey?: string
  model?: string
  thinkingMode?: boolean
  searchGrounding?: boolean
  lgpdConsent?: boolean
  telegramBotToken?: string
  telegramChatId?: string
}

export const aiSettingsApi = {
  get: () => api.get<AiSettings>('/ai-settings').then((r) => r.data),
  update: (payload: UpdateAiSettingsPayload) => api.patch<AiSettings>('/ai-settings', payload).then((r) => r.data),
}
