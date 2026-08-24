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
