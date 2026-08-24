import { api } from './client'
import type { Activity, WhatsappConnection } from './types'

export interface ConnectWhatsappPayload {
  phoneNumberId: string
  accessToken: string
  wabaId?: string
  displayPhone?: string
}

export const whatsappApi = {
  getConnection: () =>
    api
      .get<WhatsappConnection>('/integrations/whatsapp')
      .then((r) => r.data)
      .catch((err) => {
        if (err?.response?.status === 404) return null
        throw err
      }),
  connect: (payload: ConnectWhatsappPayload) => api.post<WhatsappConnection>('/integrations/whatsapp', payload).then((r) => r.data),
  disconnect: () => api.delete('/integrations/whatsapp').then(() => undefined),
  send: (contactId: string, message: string) => api.post<Activity>('/whatsapp/send', { contactId, message }).then((r) => r.data),
}
