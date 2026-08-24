/**
 * Espelha db/migrations/*.sql. Usa CamelCasePlugin do Kysely: aqui as propriedades são
 * camelCase (o que o código da app usa); o Kysely traduz para snake_case nas queries SQL.
 *
 * Colunas `numeric` do Postgres voltam como `string` por padrão do driver `pg` — evita
 * perda de precisão silenciosa em valores monetários. Faça `Number(...)` explicitamente
 * só onde for seguro (ex.: probability para exibição), nunca para somar dinheiro sem
 * revisar arredondamento.
 */
import type { Generated } from 'kysely';

export type Json = Record<string, unknown> | unknown[];

export interface WorkspacesTable {
  id: Generated<string>;
  name: string;
  slug: string;
  status: Generated<string>;
  planId: Generated<string>;
  settings: Generated<Json>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface PlansTable {
  id: string;
  name: string;
  monthlyPriceCents: number | null;
  maxSeats: number | null;
  maxCompanies: number | null;
  maxContacts: number | null;
  maxOpportunities: number | null;
  isActive: Generated<boolean>;
  createdAt: Generated<Date>;
}

export interface UsersTable {
  id: Generated<string>;
  email: string;
  emailVerifiedAt: Date | null;
  passwordHash: string | null;
  name: string;
  avatarUrl: string | null;
  status: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface RolesTable {
  id: Generated<string>;
  workspaceId: string | null;
  name: string;
  isSystem: Generated<boolean>;
  permissions: Generated<Json>;
  createdAt: Generated<Date>;
}

export interface WorkspaceMembersTable {
  id: Generated<string>;
  workspaceId: string;
  userId: string;
  roleId: string;
  status: Generated<string>;
  invitedBy: string | null;
  joinedAt: Date | null;
  createdAt: Generated<Date>;
}

export interface TeamsTable {
  id: Generated<string>;
  workspaceId: string;
  name: string;
  parentTeamId: string | null;
  createdAt: Generated<Date>;
}

export interface TeamMembersTable {
  teamId: string;
  workspaceMemberId: string;
}

export interface RefreshTokensTable {
  id: Generated<string>;
  workspaceMemberId: string;
  tokenHash: string;
  revokedAt: Date | null;
  expiresAt: Date;
  createdAt: Generated<Date>;
}

export interface CompaniesTable {
  id: Generated<string>;
  workspaceId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  employeeCount: number | null;
  annualRevenue: string | null;
  status: Generated<string>;
  ownerId: string | null;
  customFields: Generated<Json>;
  createdBy: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface ContactsTable {
  id: Generated<string>;
  workspaceId: string;
  companyId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  sourceCampaignId: string | null;
  ownerId: string | null;
  customFields: Generated<Json>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
}

export interface CampaignsTable {
  id: Generated<string>;
  workspaceId: string;
  name: string;
  type: string;
  status: Generated<string>;
  ownerId: string | null;
  startsAt: string | null;
  endsAt: string | null;
  budget: string | null;
  createdAt: Generated<Date>;
}

export interface PipelinesTable {
  id: Generated<string>;
  workspaceId: string;
  name: string;
  isDefault: Generated<boolean>;
  createdAt: Generated<Date>;
}

export interface PipelineStagesTable {
  id: Generated<string>;
  pipelineId: string;
  name: string;
  orderIndex: number;
  probability: Generated<string>;
  stageType: Generated<string>;
}

export interface OpportunitiesTable {
  id: Generated<string>;
  workspaceId: string;
  name: string;
  companyId: string;
  primaryContactId: string | null;
  pipelineId: string;
  stageId: string;
  type: Generated<string>;
  amount: Generated<string>;
  currency: Generated<string>;
  probability: string | null;
  status: Generated<string>;
  riskLevel: string | null;
  lostReason: string | null;
  sourceCampaignId: string | null;
  ownerId: string | null;
  expectedCloseDate: string | null;
  closedAt: Date | null;
  season: string | null;
  cropType: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface OpportunityContactRolesTable {
  opportunityId: string;
  contactId: string;
  role: string;
  isPrimary: Generated<boolean>;
}

export interface TasksTable {
  id: Generated<string>;
  workspaceId: string;
  subject: string;
  description: string | null;
  dueDate: Date | null;
  status: Generated<string>;
  assigneeId: string | null;
  relatedToType: string;
  relatedToId: string;
  createdBy: string | null;
  createdAt: Generated<Date>;
  completedAt: Date | null;
}

export interface ActivitiesTable {
  id: Generated<string>;
  workspaceId: string;
  type: string;
  relatedToType: string;
  relatedToId: string;
  actorId: string | null;
  payload: Generated<Json>;
  occurredAt: Generated<Date>;
  createdAt: Generated<Date>;
}

export interface WorkflowSettingsTable {
  workspaceId: string;
  workflowKey: string;
  enabled: Generated<boolean>;
  updatedAt: Generated<Date>;
}

export interface AiSuggestionsTable {
  id: Generated<string>;
  workspaceId: string;
  kind: string;
  ruleKey: string;
  relatedToType: string;
  relatedToId: string;
  severity: Generated<string>;
  title: string;
  description: string;
  payload: Generated<Json>;
  status: Generated<string>;
  createdAt: Generated<Date>;
  resolvedAt: Date | null;
}

export interface CustomerRfmSnapshotsTable {
  id: Generated<string>;
  workspaceId: string;
  companyId: string;
  computedAt: Generated<Date>;
  periodMonths: Generated<number>;
  lastPurchaseAt: Date | null;
  recencyDays: number | null;
  frequencyCount: Generated<number>;
  monetaryTotal: Generated<string>;
  lifetimeMonetaryTotal: Generated<string>;
  recencyScore: number | null;
  frequencyScore: number | null;
  monetaryScore: number | null;
  rfmSegment: string | null;
}

export interface SegmentsTable {
  id: Generated<string>;
  workspaceId: string;
  name: string;
  type: string;
  criteria: Json | null;
  createdBy: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface SegmentMembersTable {
  segmentId: string;
  companyId: string;
  addedAt: Generated<Date>;
}

export interface IntegrationConnectionsTable {
  id: Generated<string>;
  workspaceId: string;
  provider: string;
  externalId: string;
  wabaId: string | null;
  displayPhone: string | null;
  accessToken: string;
  status: Generated<string>;
  connectedBy: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface WhatsappMessagesTable {
  id: Generated<string>;
  workspaceId: string;
  wamid: string;
  direction: string;
  contactId: string | null;
  activityId: string | null;
  status: Generated<string>;
  createdAt: Generated<Date>;
}

export interface ProductsTable {
  id: Generated<string>;
  workspaceId: string;
  sku: string;
  name: string;
  category: string;
  unit: Generated<string>;
  price: Generated<string>;
  trackStock: Generated<boolean>;
  stockQuantity: Generated<string>;
  status: Generated<string>;
  customFields: Generated<Json>;
  createdBy: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface OpportunityLineItemsTable {
  id: Generated<string>;
  workspaceId: string;
  opportunityId: string;
  productId: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  subtotal: Generated<string>;
  createdAt: Generated<Date>;
}

export interface EquipmentTable {
  id: Generated<string>;
  workspaceId: string;
  companyId: string;
  productId: string | null;
  name: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  purchaseDate: string | null;
  status: Generated<string>;
  customFields: Generated<Json>;
  createdBy: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface ServiceOrdersTable {
  id: Generated<string>;
  workspaceId: string;
  companyId: string;
  contactId: string | null;
  equipmentId: string | null;
  type: Generated<string>;
  status: Generated<string>;
  description: string | null;
  technicianId: string | null;
  scheduledDate: Date | null;
  completedAt: Date | null;
  createdBy: string | null;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
}

export interface ServiceOrderPartsTable {
  id: Generated<string>;
  workspaceId: string;
  serviceOrderId: string;
  productId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  subtotal: Generated<string>;
  createdAt: Generated<Date>;
}

export interface InventoryMovementsTable {
  id: Generated<string>;
  workspaceId: string;
  productId: string;
  type: string;
  quantityDelta: string;
  relatedToType: string | null;
  relatedToId: string | null;
  actorId: string | null;
  note: string | null;
  createdAt: Generated<Date>;
}

export interface Database {
  workspaces: WorkspacesTable;
  users: UsersTable;
  roles: RolesTable;
  workspaceMembers: WorkspaceMembersTable;
  teams: TeamsTable;
  teamMembers: TeamMembersTable;
  refreshTokens: RefreshTokensTable;
  companies: CompaniesTable;
  contacts: ContactsTable;
  campaigns: CampaignsTable;
  pipelines: PipelinesTable;
  pipelineStages: PipelineStagesTable;
  opportunities: OpportunitiesTable;
  opportunityContactRoles: OpportunityContactRolesTable;
  tasks: TasksTable;
  activities: ActivitiesTable;
  workflowSettings: WorkflowSettingsTable;
  aiSuggestions: AiSuggestionsTable;
  customerRfmSnapshots: CustomerRfmSnapshotsTable;
  segments: SegmentsTable;
  segmentMembers: SegmentMembersTable;
  integrationConnections: IntegrationConnectionsTable;
  whatsappMessages: WhatsappMessagesTable;
  plans: PlansTable;
  products: ProductsTable;
  opportunityLineItems: OpportunityLineItemsTable;
  equipment: EquipmentTable;
  serviceOrders: ServiceOrdersTable;
  serviceOrderParts: ServiceOrderPartsTable;
  inventoryMovements: InventoryMovementsTable;
}
