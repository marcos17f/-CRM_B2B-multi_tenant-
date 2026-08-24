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
  planId: string | null;
  settings: Generated<Json>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
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
}
