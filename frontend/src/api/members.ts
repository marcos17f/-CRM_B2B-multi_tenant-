import { api } from './client'
import type { InviteMemberResult, Member } from './types'

export interface InviteMemberPayload {
  email: string
  name?: string
  roleName: 'admin' | 'sales_rep' | 'read_only'
}

export const membersApi = {
  list: () => api.get<Member[]>('/members').then((r) => r.data),
  invite: (payload: InviteMemberPayload) =>
    api.post<InviteMemberResult>('/members/invite', payload).then((r) => r.data),
}
