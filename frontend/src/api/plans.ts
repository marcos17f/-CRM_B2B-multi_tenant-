import { api } from './client'
import type { Plan, PlanUsage } from './types'

export const plansApi = {
  list: () => api.get<Plan[]>('/plans').then((r) => r.data),
  current: () => api.get<PlanUsage>('/workspaces/me/plan').then((r) => r.data),
  change: (planId: string) => api.patch('/workspaces/me/plan', { planId }).then((r) => r.data),
}

export interface BrandingPayload {
  logoUrl?: string
  primaryColor?: string
  customDomain?: string
}

export const brandingApi = {
  update: (payload: BrandingPayload) => api.patch('/workspaces/me/branding', payload).then((r) => r.data),
}
