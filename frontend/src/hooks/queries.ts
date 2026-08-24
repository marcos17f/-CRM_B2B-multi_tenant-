import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { companiesApi, type CompanyPayload } from '@/api/companies'
import { contactsApi, type ContactPayload } from '@/api/contacts'
import { campaignsApi, type CampaignPayload } from '@/api/campaigns'
import { pipelinesApi } from '@/api/pipelines'
import {
  opportunitiesApi,
  type CreateOpportunityPayload,
  type OpportunityFilters,
  type UpdateOpportunityPayload,
} from '@/api/opportunities'
import { tasksApi, type CreateTaskPayload, type TaskFilters, type UpdateTaskPayload } from '@/api/tasks'
import { activitiesApi, type CreateActivityPayload } from '@/api/activities'
import { membersApi, type InviteMemberPayload } from '@/api/members'
import { workflowsApi } from '@/api/workflows'
import { aiApi } from '@/api/ai'
import { reportsApi, type RfmListFilters } from '@/api/reports'
import { segmentsApi, type SegmentPayload } from '@/api/segments'
import { plansApi, brandingApi, type BrandingPayload } from '@/api/plans'
import { productsApi, type ProductPayload } from '@/api/products'
import { equipmentApi, type EquipmentPayload } from '@/api/equipment'
import { serviceOrdersApi, type ServiceOrderPayload, type ServiceOrderFilters } from '@/api/service-orders'
import { opportunityLineItemsApi, type AddLineItemPayload } from '@/api/opportunity-line-items'
import { whatsappApi, type ConnectWhatsappPayload } from '@/api/whatsapp'
import { aiSettingsApi, type UpdateAiSettingsPayload } from '@/api/ai-settings'
import type { RelatedToType } from '@/api/types'

// ---------- Companies ----------
export function useCompanies() {
  return useQuery({ queryKey: ['companies'], queryFn: companiesApi.list })
}
export function useCompany(id: string | undefined) {
  return useQuery({ queryKey: ['companies', id], queryFn: () => companiesApi.get(id!), enabled: !!id })
}
export function useCreateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompanyPayload) => companiesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}
export function useUpdateCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CompanyPayload> }) => companiesApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['companies'] })
      qc.invalidateQueries({ queryKey: ['companies', vars.id] })
    },
  })
}
export function useDeleteCompany() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => companiesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['companies'] }),
  })
}

// ---------- Contacts ----------
export function useContacts(companyId?: string) {
  return useQuery({ queryKey: ['contacts', companyId ?? 'all'], queryFn: () => contactsApi.list(companyId) })
}
export function useContact(id: string | undefined) {
  return useQuery({ queryKey: ['contacts', 'byId', id], queryFn: () => contactsApi.get(id!), enabled: !!id })
}
export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ContactPayload) => contactsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ContactPayload> }) => contactsApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contacts', 'byId', vars.id] })
    },
  })
}
export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => contactsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

// ---------- Campaigns ----------
export function useCampaigns() {
  return useQuery({ queryKey: ['campaigns'], queryFn: campaignsApi.list })
}
export function useCampaign(id: string | undefined) {
  return useQuery({ queryKey: ['campaigns', id], queryFn: () => campaignsApi.get(id!), enabled: !!id })
}
export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CampaignPayload) => campaignsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}
export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CampaignPayload> }) => campaignsApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['campaigns', vars.id] })
    },
  })
}

// ---------- Pipelines ----------
export function usePipelines() {
  return useQuery({ queryKey: ['pipelines'], queryFn: pipelinesApi.list, staleTime: 5 * 60 * 1000 })
}

// ---------- Opportunities ----------
export function useOpportunities(filters: OpportunityFilters = {}) {
  return useQuery({ queryKey: ['opportunities', filters], queryFn: () => opportunitiesApi.list(filters) })
}
export function useOpportunity(id: string | undefined) {
  return useQuery({ queryKey: ['opportunities', 'byId', id], queryFn: () => opportunitiesApi.get(id!), enabled: !!id })
}
export function useCreateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOpportunityPayload) => opportunitiesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['opportunities'] }),
  })
}
export function useUpdateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateOpportunityPayload }) => opportunitiesApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['opportunities', 'byId', vars.id] })
    },
  })
}
export function useMoveOpportunityStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageId, lostReason }: { id: string; stageId: string; lostReason?: string }) =>
      opportunitiesApi.moveStage(id, stageId, lostReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
export function useReopenOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => opportunitiesApi.reopen(id, stageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

// ---------- Tasks ----------
export function useTasks(filters: TaskFilters = {}) {
  return useQuery({ queryKey: ['tasks', filters], queryFn: () => tasksApi.list(filters) })
}
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) => tasksApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['activities'] })
    },
  })
}

// ---------- Activities ----------
export function useActivities(relatedToType: RelatedToType | undefined, relatedToId: string | undefined) {
  return useQuery({
    queryKey: ['activities', relatedToType, relatedToId],
    queryFn: () => activitiesApi.listForEntity(relatedToType!, relatedToId!),
    enabled: !!relatedToType && !!relatedToId,
  })
}
export function useRecentActivities(limit = 20) {
  return useQuery({ queryKey: ['activities', 'recent', limit], queryFn: () => activitiesApi.listRecent(limit) })
}
export function useCreateActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateActivityPayload) => activitiesApi.create(payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['activities', vars.relatedToType, vars.relatedToId] })
    },
  })
}

// ---------- Members ----------
export function useMembers() {
  return useQuery({ queryKey: ['members'], queryFn: membersApi.list })
}
export function useInviteMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => membersApi.invite(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })
}

// ---------- Workflows ----------
export function useWorkflows() {
  return useQuery({ queryKey: ['workflows'], queryFn: workflowsApi.list })
}
export function useSetWorkflowEnabled() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => workflowsApi.setEnabled(key, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  })
}

// ---------- AI suggestions ----------
export function useAiSuggestions() {
  return useQuery({ queryKey: ['ai-suggestions'], queryFn: aiApi.list, refetchInterval: 60_000 })
}
export function useDismissAiSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aiApi.dismiss(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-suggestions'] }),
  })
}
export function useApproveAiSuggestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => aiApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-suggestions'] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

// ---------- Reports (RFM / top customers / sazonalidade) ----------
export function useRfmList(filters: RfmListFilters = {}) {
  return useQuery({ queryKey: ['reports', 'rfm', filters], queryFn: () => reportsApi.listRfm(filters) })
}
export function useRecomputeRfm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodMonths?: number) => reportsApi.recomputeRfm(periodMonths),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports', 'rfm'] })
      qc.invalidateQueries({ queryKey: ['reports', 'top-customers'] })
    },
  })
}
export function useCompanyRfmHistory(companyId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'rfm', 'company', companyId],
    queryFn: () => reportsApi.companyRfmHistory(companyId!),
    enabled: !!companyId,
  })
}
export function useTopCustomers(limit = 20, lifetime = false) {
  return useQuery({ queryKey: ['reports', 'top-customers', limit, lifetime], queryFn: () => reportsApi.topCustomers(limit, lifetime) })
}
export function useSeasonality() {
  return useQuery({ queryKey: ['reports', 'seasonality'], queryFn: reportsApi.seasonality })
}
export function useMessagingMetrics(from: Date, to: Date) {
  return useQuery({
    queryKey: ['reports', 'messaging', from.toISOString(), to.toISOString()],
    queryFn: () => reportsApi.messaging(from, to),
  })
}

// ---------- Segments ----------
export function useSegments() {
  return useQuery({ queryKey: ['segments'], queryFn: segmentsApi.list })
}
export function useSegment(id: string | undefined) {
  return useQuery({ queryKey: ['segments', id], queryFn: () => segmentsApi.get(id!), enabled: !!id })
}
export function useSegmentMembers(id: string | undefined) {
  return useQuery({ queryKey: ['segments', id, 'members'], queryFn: () => segmentsApi.listMembers(id!), enabled: !!id })
}
export function useCreateSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SegmentPayload) => segmentsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['segments'] }),
  })
}
export function useDeleteSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => segmentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['segments'] }),
  })
}
export function useAddSegmentMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: string }) => segmentsApi.addMember(id, companyId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['segments', vars.id, 'members'] })
      qc.invalidateQueries({ queryKey: ['segments'] })
    },
  })
}
export function useRemoveSegmentMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: string }) => segmentsApi.removeMember(id, companyId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['segments', vars.id, 'members'] })
      qc.invalidateQueries({ queryKey: ['segments'] })
    },
  })
}
export function useRecomputeSegment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => segmentsApi.recompute(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['segments', id, 'members'] })
      qc.invalidateQueries({ queryKey: ['segments'] })
    },
  })
}

// ---------- Plans / branding ----------
export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: plansApi.list, staleTime: 5 * 60 * 1000 })
}
export function useCurrentPlan() {
  return useQuery({ queryKey: ['plans', 'current'], queryFn: plansApi.current })
}
export function useChangePlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) => plansApi.change(planId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans', 'current'] }),
  })
}
// Branding não passa pelo AuthContext (que só carrega workspace no boot/login) — o form
// usa a resposta da mutation direto pra atualizar a UI, ver branding-card.tsx.
export function useUpdateBranding() {
  return useMutation({ mutationFn: (payload: BrandingPayload) => brandingApi.update(payload) })
}

// ---------- Products (catálogo agro) ----------
export function useProducts(category?: string) {
  return useQuery({ queryKey: ['products', category ?? 'all'], queryFn: () => productsApi.list(category) })
}
export function useProduct(id: string | undefined) {
  return useQuery({ queryKey: ['products', 'byId', id], queryFn: () => productsApi.get(id!), enabled: !!id })
}
export function useProductMovements(id: string | undefined) {
  return useQuery({ queryKey: ['products', 'byId', id, 'movements'], queryFn: () => productsApi.listMovements(id!), enabled: !!id })
}
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductPayload) => productsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductPayload> & { status?: string } }) =>
      productsApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['products', 'byId', vars.id] })
    },
  })
}
export function useAdjustStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, quantityDelta, type, note }: { id: string; quantityDelta: number; type: 'adjustment' | 'restock'; note?: string }) =>
      productsApi.adjustStock(id, quantityDelta, type, note),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['products'] })
      qc.invalidateQueries({ queryKey: ['products', 'byId', vars.id] })
      qc.invalidateQueries({ queryKey: ['products', 'byId', vars.id, 'movements'] })
    },
  })
}

// ---------- Equipment ----------
export function useEquipmentList(companyId?: string) {
  return useQuery({ queryKey: ['equipment', companyId ?? 'all'], queryFn: () => equipmentApi.list(companyId) })
}
export function useEquipmentItem(id: string | undefined) {
  return useQuery({ queryKey: ['equipment', 'byId', id], queryFn: () => equipmentApi.get(id!), enabled: !!id })
}
export function useCreateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: EquipmentPayload) => equipmentApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })
}
export function useUpdateEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<EquipmentPayload, 'companyId'>> & { status?: string } }) =>
      equipmentApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })
}
export function useDeleteEquipment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => equipmentApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['equipment'] }),
  })
}

// ---------- Service orders ----------
export function useServiceOrders(filters: ServiceOrderFilters = {}) {
  return useQuery({ queryKey: ['service-orders', filters], queryFn: () => serviceOrdersApi.list(filters) })
}
export function useServiceOrder(id: string | undefined) {
  return useQuery({ queryKey: ['service-orders', 'byId', id], queryFn: () => serviceOrdersApi.get(id!), enabled: !!id })
}
export function useServiceOrderParts(id: string | undefined) {
  return useQuery({ queryKey: ['service-orders', 'byId', id, 'parts'], queryFn: () => serviceOrdersApi.listParts(id!), enabled: !!id })
}
export function useCreateServiceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ServiceOrderPayload) => serviceOrdersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['service-orders'] }),
  })
}
export function useUpdateServiceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Omit<ServiceOrderPayload, 'companyId'>> }) =>
      serviceOrdersApi.update(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['service-orders'] })
      qc.invalidateQueries({ queryKey: ['service-orders', 'byId', vars.id] })
    },
  })
}
function invalidateServiceOrder(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['service-orders'] })
  qc.invalidateQueries({ queryKey: ['service-orders', 'byId', id] })
  qc.invalidateQueries({ queryKey: ['activities', 'service_order', id] })
}
export function useStartServiceOrder() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => serviceOrdersApi.start(id), onSuccess: (_d, id) => invalidateServiceOrder(qc, id) })
}
export function useCompleteServiceOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => serviceOrdersApi.complete(id),
    onSuccess: (_d, id) => {
      invalidateServiceOrder(qc, id)
      qc.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
export function useCancelServiceOrder() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: string) => serviceOrdersApi.cancel(id), onSuccess: (_d, id) => invalidateServiceOrder(qc, id) })
}
export function useAddServiceOrderPart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { productId: string; description?: string; quantity: number; unitPrice?: number } }) =>
      serviceOrdersApi.addPart(id, payload),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['service-orders', 'byId', vars.id, 'parts'] }),
  })
}
export function useRemoveServiceOrderPart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, partId }: { id: string; partId: string }) => serviceOrdersApi.removePart(id, partId),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['service-orders', 'byId', vars.id, 'parts'] }),
  })
}

// ---------- Opportunity line items ----------
export function useOpportunityLineItems(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['opportunities', 'byId', opportunityId, 'line-items'],
    queryFn: () => opportunityLineItemsApi.list(opportunityId!),
    enabled: !!opportunityId,
  })
}
export function useAddLineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ opportunityId, payload }: { opportunityId: string; payload: AddLineItemPayload }) =>
      opportunityLineItemsApi.add(opportunityId, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['opportunities', 'byId', vars.opportunityId, 'line-items'] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}
export function useRemoveLineItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ opportunityId, lineItemId }: { opportunityId: string; lineItemId: string }) =>
      opportunityLineItemsApi.remove(opportunityId, lineItemId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['opportunities', 'byId', vars.opportunityId, 'line-items'] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

// ---------- WhatsApp ----------
export function useWhatsappConnection() {
  return useQuery({ queryKey: ['whatsapp', 'connection'], queryFn: whatsappApi.getConnection })
}
export function useConnectWhatsapp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConnectWhatsappPayload) => whatsappApi.connect(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] }),
  })
}
export function useDisconnectWhatsapp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => whatsappApi.disconnect(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['whatsapp', 'connection'] }),
  })
}
// ---------- Central de I.A. ----------
export function useAiSettings() {
  return useQuery({ queryKey: ['ai-settings'], queryFn: aiSettingsApi.get })
}
export function useUpdateAiSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAiSettingsPayload) => aiSettingsApi.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-settings'] }),
  })
}

export function useSendWhatsapp() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ contactId, message }: { contactId: string; message: string }) => whatsappApi.send(contactId, message),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['activities', 'contact', vars.contactId] }),
  })
}
