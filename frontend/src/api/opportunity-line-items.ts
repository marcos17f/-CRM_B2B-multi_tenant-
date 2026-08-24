import { api } from './client'
import type { OpportunityLineItem } from './types'

export interface AddLineItemPayload {
  productId?: string
  description: string
  quantity: number
  unitPrice: number
}

export const opportunityLineItemsApi = {
  list: (opportunityId: string) => api.get<OpportunityLineItem[]>(`/opportunities/${opportunityId}/line-items`).then((r) => r.data),
  add: (opportunityId: string, payload: AddLineItemPayload) =>
    api.post<OpportunityLineItem>(`/opportunities/${opportunityId}/line-items`, payload).then((r) => r.data),
  remove: (opportunityId: string, lineItemId: string) =>
    api.delete(`/opportunities/${opportunityId}/line-items/${lineItemId}`).then(() => undefined),
}
