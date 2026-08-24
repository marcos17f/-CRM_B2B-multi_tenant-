import { api } from './client'
import type { Contact } from './types'

export interface ContactPayload {
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  title?: string
  companyId?: string
  sourceCampaignId?: string
  ownerId?: string
  customFields?: Record<string, unknown>
}

export const contactsApi = {
  list: (companyId?: string) =>
    api.get<Contact[]>('/contacts', { params: companyId ? { companyId } : undefined }).then((r) => r.data),
  get: (id: string) => api.get<Contact>(`/contacts/${id}`).then((r) => r.data),
  create: (payload: ContactPayload) => api.post<Contact>('/contacts', payload).then((r) => r.data),
  update: (id: string, payload: Partial<ContactPayload>) =>
    api.patch<Contact>(`/contacts/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/contacts/${id}`).then(() => undefined),
}
