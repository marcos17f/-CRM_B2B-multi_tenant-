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
  season: string | null
  cropType: string | null
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'pending' | 'completed'
export type RelatedToType = 'company' | 'contact' | 'opportunity' | 'equipment' | 'service_order'

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

export const MANUAL_ACTIVITY_TYPES = ['call', 'email', 'meeting', 'note', 'whatsapp'] as const
export type ManualActivityType = (typeof MANUAL_ACTIVITY_TYPES)[number]
export type ActivityType =
  | ManualActivityType
  | 'stage_change'
  | 'field_change'
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

// ---------- RFM / Reports ----------
export type RfmSegmentKey = 'campeoes' | 'fieis' | 'novos' | 'em_risco' | 'perdidos' | 'precisa_atencao'

export interface RfmRow {
  companyId: UUID
  companyName: string
  companyStatus: string
  computedAt: string
  periodMonths: number
  lastPurchaseAt: string | null
  recencyDays: number | null
  frequencyCount: number
  monetaryTotal: string
  lifetimeMonetaryTotal: string
  recencyScore: number
  frequencyScore: number
  monetaryScore: number
  rfmSegment: RfmSegmentKey
}

export interface RfmSnapshot {
  id: UUID
  workspaceId: UUID
  companyId: UUID
  computedAt: string
  periodMonths: number
  lastPurchaseAt: string | null
  recencyDays: number | null
  frequencyCount: number
  monetaryTotal: string
  lifetimeMonetaryTotal: string
  recencyScore: number | null
  frequencyScore: number | null
  monetaryScore: number | null
  rfmSegment: RfmSegmentKey | null
}

export interface TopCustomer {
  companyId: UUID
  companyName: string
  monetaryTotal?: string
  lifetimeMonetaryTotal?: string
}

export interface TopCustomersResult {
  periodBasis: 'lifetime' | 'last_snapshot_window'
  totalRevenue: number
  topRevenue: number
  percentOfTotalRevenue: number
  customers: TopCustomer[]
}

export interface MessagingMetrics {
  messagesSent: number
  firstResponseTimeMinutes: number | null
  responseRate: number
  bySender: { human: number; automation: number }
}

export interface SeasonalityRow {
  season: string
  cropType: string | null
  opportunityCount: string
  totalAmount: string
  wonAmount: string
}

// ---------- Segments ----------
export type SegmentType = 'manual' | 'smart'

export interface Segment {
  id: UUID
  name: string
  type: SegmentType
  criteria: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  memberCount: string
}

export interface SegmentMember {
  id: UUID
  name: string
  industry: string | null
  status: string
  addedAt: string
}

// ---------- Plans ----------
export interface Plan {
  id: string
  name: string
  monthlyPriceCents: number | null
  maxSeats: number | null
  maxCompanies: number | null
  maxContacts: number | null
  maxOpportunities: number | null
  isActive: boolean
  createdAt: string
}

export interface PlanUsage {
  plan: Plan
  usage: {
    seats: number
    companies: number
    contacts: number
    opportunities: number
  }
}

// ---------- Products / Catálogo agro ----------
export type ProductCategory = 'machine' | 'seed' | 'grain' | 'part' | 'service'

export interface Product {
  id: UUID
  workspaceId: UUID
  sku: string
  name: string
  category: ProductCategory
  unit: string
  price: string
  trackStock: boolean
  stockQuantity: string
  status: 'active' | 'discontinued'
  customFields: Record<string, unknown>
  createdBy: UUID | null
  createdAt: string
  updatedAt: string
}

export interface InventoryMovement {
  id: UUID
  productId: UUID
  type: 'sale' | 'service_use' | 'adjustment' | 'restock'
  quantityDelta: string
  relatedToType: 'opportunity' | 'service_order' | null
  relatedToId: UUID | null
  actorId: UUID | null
  note: string | null
  createdAt: string
}

// ---------- Opportunity line items ----------
export interface OpportunityLineItem {
  id: UUID
  opportunityId: UUID
  productId: UUID | null
  description: string
  quantity: string
  unitPrice: string
  subtotal: string
  createdAt: string
}

// ---------- Equipment ----------
export interface Equipment {
  id: UUID
  workspaceId: UUID
  companyId: UUID
  productId: UUID | null
  name: string
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  purchaseDate: string | null
  status: 'active' | 'inactive' | 'sold'
  customFields: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// ---------- Service orders ----------
export type ServiceOrderType = 'maintenance' | 'repair' | 'installation' | 'inspection'
export type ServiceOrderStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

export interface ServiceOrder {
  id: UUID
  workspaceId: UUID
  companyId: UUID
  contactId: UUID | null
  equipmentId: UUID | null
  type: ServiceOrderType
  status: ServiceOrderStatus
  description: string | null
  technicianId: UUID | null
  scheduledDate: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ServiceOrderPart {
  id: UUID
  serviceOrderId: UUID
  productId: UUID
  description: string
  quantity: string
  unitPrice: string
  subtotal: string
  createdAt: string
}

// ---------- Central de I.A. ----------
export interface AiSettings {
  enabled: boolean
  agentEnabled: boolean
  model: string
  thinkingMode: boolean
  searchGrounding: boolean
  lgpdConsentAt: string | null
  hasApiKey: boolean
  hasTelegram: boolean
}

// ---------- WhatsApp ----------
export interface WhatsappConnection {
  id: UUID
  externalId: string
  wabaId: string | null
  displayPhone: string | null
  status: 'active' | 'disconnected'
  createdAt: string
  updatedAt: string
}
