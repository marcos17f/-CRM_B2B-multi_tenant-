import { api } from './client'
import type { LoginResponse, LoginResult } from './types'

export interface RegisterPayload {
  workspaceName: string
  workspaceSlug: string
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface SelectWorkspacePayload {
  preAuthToken: string
  workspaceId: string
}

export interface AcceptInvitePayload {
  inviteToken: string
  password: string
  name?: string
}

export const authApi = {
  register: (payload: RegisterPayload) => api.post<LoginResult>('/auth/register', payload).then((r) => r.data),
  login: (payload: LoginPayload) => api.post<LoginResponse>('/auth/login', payload).then((r) => r.data),
  selectWorkspace: (payload: SelectWorkspacePayload) =>
    api.post<Omit<LoginResult, 'workspace'>>('/auth/select-workspace', payload).then((r) => r.data),
  acceptInvite: (payload: AcceptInvitePayload) =>
    api.post<Omit<LoginResult, 'workspace'>>('/auth/accept-invite', payload).then((r) => r.data),
}
