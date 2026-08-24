import { api } from './client'
import type { WorkspaceMeResponse } from './types'

export const workspacesApi = {
  me: () => api.get<WorkspaceMeResponse>('/workspaces/me').then((r) => r.data),
}
