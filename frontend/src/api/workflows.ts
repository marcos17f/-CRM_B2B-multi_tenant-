import { api } from './client'

export interface WorkflowDefinition {
  key: string
  name: string
  description: string
  trigger: string
  action: string
  enabled: boolean
}

export const workflowsApi = {
  list: () => api.get<WorkflowDefinition[]>('/workflows').then((r) => r.data),
  setEnabled: (key: string, enabled: boolean) =>
    api.patch<{ key: string; enabled: boolean }>(`/workflows/${key}`, { enabled }).then((r) => r.data),
}
