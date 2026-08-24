export type UUID = string

export interface Workspace {
  id: UUID
  name: string
  slug: string
  status?: string
  planId?: string | null
  settings?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  workspace: { id: UUID; name: string; slug: string }
}

export interface WorkspaceSelectionRequired {
  requiresWorkspaceSelection: true
  preAuthToken: string
  workspaces: { id: UUID; name: string; slug: string }[]
}

export type LoginResponse = LoginResult | WorkspaceSelectionRequired

export interface WorkspaceMeResponse {
  workspace: Workspace
  roleId: UUID
  permissions: string[]
}

export interface Company {
  id: UUID
  workspaceId: UUID
  name: string
  domain: string | null
  industry: string | null
  employeeCount: number | null
  annualRevenue: string | null
  status: 'prospect' | 'customer' | 'churned' | string
  ownerId: UUID | null
  customFields: Record<string, unknown>
  createdBy: UUID | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export interface Contact {
  id: UUID
  workspaceId: UUID
  companyId: UUID | null
  firstName: string
  lastName: string | null
  email: string | null
  phone: string | null
  title: string | null
  sourceCampaignId: UUID | null
  ownerId: UUID | null
  customFields: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type CampaignType = 'outbound' | 'email' | 'ads' | 'event' | 'referral' | 'other'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended'

export interface Campaign {
  id: UUID
  workspaceId: UUID
  name: string
  type: CampaignType
  status: CampaignStatus
  ownerId: UUID | null
  startsAt: string | null
  endsAt: string | null
  budget: string | null
  createdAt: string
}

export type StageType = 'open' | 'won' | 'lost'

export interface PipelineStage {
  id: UUID
  pipelineId: UUID
  name: string
  orderIndex: number
  probability: string
  stageType: StageType
}

export interface Pipeline {
  id: UUID
  workspaceId: UUID
  name: string
  isDefault: boolean
  createdAt: string
  stages: PipelineStage[]
}

export type OpportunityType = 'new_business' | 'upsell' | 'renewal'
export type OpportunityStatus = 'open' | 'won' | 'lost'
export type RiskLevel = 'low' | 'medium' | 'high'

export interface Opportunity {
  id: UUID
  workspaceId: UUID
  name: string
  companyId: UUID
  primaryContactId: UUID | null
  pipelineId: UUID
  stageId: UUID
  type: OpportunityType
  amount: string
  currency: string
  probability: string | null
  status: OpportunityStatus
  riskLevel: RiskLevel | null
  lostReason: string | null
  sourceCampaignId: UUID | null
  ownerId: UUID | null
  expectedCloseDate: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'pending' | 'completed'
export type RelatedToType = 'company' | 'contact' | 'opportunity'

export interface Task {
  id: UUID
  workspaceId: UUID
  subject: string
  description: string | null
  dueDate: string | null
  status: TaskStatus
  assigneeId: UUID | null
  relatedToType: RelatedToType
  relatedToId: UUID
  createdBy: UUID | null
  createdAt: string
  completedAt: string | null
}

export const MANUAL_ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note'] as const
export type ManualActivityType = (typeof MANUAL_ACTIVITY_TYPES)[number]
export type ActivityType =
  | ManualActivityType
  | 'stage_change'
  | 'task_created'
  | 'task_completed'
  | 'system'
  | 'ai_suggestion'

export interface Activity {
  id: UUID
  workspaceId: UUID
  type: ActivityType
  relatedToType: RelatedToType
  relatedToId: UUID
  actorId: UUID | null
  payload: Record<string, unknown>
  occurredAt: string
  createdAt: string
}

export type MemberStatus = 'invited' | 'active' | 'suspended'

export interface Member {
  id: UUID
  status: MemberStatus
  joinedAt: string | null
  name: string
  email: string
  roleName: string
}

export interface InviteMemberResult {
  memberId: UUID
  inviteToken: string
  inviteUrl: string
}
