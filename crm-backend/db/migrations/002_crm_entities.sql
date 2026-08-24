-- 002_crm_entities.sql
-- Companies, contacts, campaigns, pipelines/stages, opportunities, tasks, activities.
-- Ver crm-arquitetura.md seção 1.

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
create table companies (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  domain          text,
  industry        text,
  employee_count  int,
  annual_revenue  numeric(14, 2),
  status          text not null default 'prospect' check (status in ('prospect', 'customer', 'churned')),
  owner_id        uuid references workspace_members(id),
  custom_fields   jsonb not null default '{}',
  created_by      uuid references workspace_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);
create index idx_companies_workspace on companies (workspace_id) where deleted_at is null;
create trigger trg_companies_updated_at before update on companies
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- campaigns (precisa existir antes de contacts, que a referencia como origem)
-- ---------------------------------------------------------------------------
create table campaigns (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('outbound', 'email', 'ads', 'event', 'referral', 'other')),
  status        text not null default 'active' check (status in ('draft', 'active', 'paused', 'ended')),
  owner_id      uuid references workspace_members(id),
  starts_at     date,
  ends_at       date,
  budget        numeric(14, 2),
  created_at    timestamptz not null default now()
);
create index idx_campaigns_workspace on campaigns (workspace_id);

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
create table contacts (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  company_id          uuid references companies(id) on delete set null,
  first_name          text not null,
  last_name           text,
  email               citext,
  phone               text,
  title               text,
  source_campaign_id  uuid references campaigns(id) on delete set null,
  owner_id            uuid references workspace_members(id),
  custom_fields       jsonb not null default '{}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz,
  unique (workspace_id, email)
);
create index idx_contacts_workspace on contacts (workspace_id) where deleted_at is null;
create index idx_contacts_company on contacts (company_id);
create trigger trg_contacts_updated_at before update on contacts
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- pipelines / pipeline_stages (o "Board")
-- ---------------------------------------------------------------------------
create table pipelines (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);
create index idx_pipelines_workspace on pipelines (workspace_id);

create table pipeline_stages (
  id            uuid primary key default gen_random_uuid(),
  pipeline_id   uuid not null references pipelines(id) on delete cascade,
  name          text not null,
  order_index   int not null,
  probability   numeric(4, 3) not null default 0 check (probability >= 0 and probability <= 1),
  stage_type    text not null default 'open' check (stage_type in ('open', 'won', 'lost')),
  unique (pipeline_id, order_index)
);

-- ---------------------------------------------------------------------------
-- opportunities
-- ---------------------------------------------------------------------------
create table opportunities (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references workspaces(id) on delete cascade,
  name                  text not null,
  company_id            uuid not null references companies(id),
  primary_contact_id    uuid references contacts(id),
  pipeline_id           uuid not null references pipelines(id),
  stage_id              uuid not null references pipeline_stages(id),
  type                  text not null default 'new_business' check (type in ('new_business', 'upsell', 'renewal')),
  amount                numeric(14, 2) not null default 0,
  currency              text not null default 'BRL',
  probability           numeric(4, 3) check (probability >= 0 and probability <= 1),
  status                text not null default 'open' check (status in ('open', 'won', 'lost')),
  risk_level            text check (risk_level in ('low', 'medium', 'high')),
  lost_reason           text,
  source_campaign_id    uuid references campaigns(id),
  owner_id              uuid references workspace_members(id),
  expected_close_date   date,
  closed_at             timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint chk_lost_reason_required check (status <> 'lost' or lost_reason is not null)
);
create index idx_opportunities_workspace_stage on opportunities (workspace_id, stage_id);
create index idx_opportunities_workspace_owner on opportunities (workspace_id, owner_id) where status = 'open';
create trigger trg_opportunities_updated_at before update on opportunities
  for each row execute function set_updated_at();

-- garante que stage_id pertence ao pipeline_id da mesma oportunidade (regra de negócio 1.6)
create or replace function check_opportunity_stage_belongs_to_pipeline()
returns trigger as $$
begin
  if not exists (
    select 1 from pipeline_stages
    where id = new.stage_id and pipeline_id = new.pipeline_id
  ) then
    raise exception 'stage_id % não pertence ao pipeline_id %', new.stage_id, new.pipeline_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_opportunities_stage_pipeline_check
  before insert or update of stage_id, pipeline_id on opportunities
  for each row execute function check_opportunity_stage_belongs_to_pipeline();

-- ---------------------------------------------------------------------------
-- opportunity_contact_roles (stakeholders do deal)
-- ---------------------------------------------------------------------------
create table opportunity_contact_roles (
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  contact_id      uuid not null references contacts(id) on delete cascade,
  role            text not null check (role in ('decision_maker', 'influencer', 'champion', 'blocker', 'user_final')),
  is_primary      boolean not null default false,
  primary key (opportunity_id, contact_id)
);

-- ---------------------------------------------------------------------------
-- tasks (ação pendente/acionável — associação polimórfica sem FK de banco, ver 1.7)
-- ---------------------------------------------------------------------------
create table tasks (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  subject           text not null,
  description       text,
  due_date          timestamptz,
  status            text not null default 'pending' check (status in ('pending', 'completed')),
  assignee_id       uuid references workspace_members(id),
  related_to_type   text not null check (related_to_type in ('company', 'contact', 'opportunity')),
  related_to_id     uuid not null,
  created_by        uuid references workspace_members(id),
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);
create index idx_tasks_workspace_assignee_status on tasks (workspace_id, assignee_id, status);
create index idx_tasks_related on tasks (related_to_type, related_to_id);

-- ---------------------------------------------------------------------------
-- activities (log imutável — nunca UPDATE/DELETE pela aplicação, ver seção 5)
-- ---------------------------------------------------------------------------
create table activities (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  type              text not null check (type in (
                      'call', 'email', 'meeting', 'note', 'stage_change', 'field_change',
                      'task_created', 'task_completed', 'ai_suggestion', 'system'
                    )),
  related_to_type   text not null check (related_to_type in ('company', 'contact', 'opportunity')),
  related_to_id     uuid not null,
  actor_id          uuid references workspace_members(id),
  payload           jsonb not null default '{}',
  occurred_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);
create index idx_activities_related on activities (related_to_type, related_to_id, occurred_at desc);
create index idx_activities_workspace on activities (workspace_id);

-- Trava de aplicação da regra "append-only": qualquer UPDATE/DELETE feito fora de um
-- superusuário/processo de retenção autorizado é bloqueado no próprio banco.
create or replace function forbid_activity_mutation()
returns trigger as $$
begin
  raise exception 'activities é append-only: % não é permitido (use o processo de retenção/LGPD para exclusões)', tg_op;
end;
$$ language plpgsql;

create trigger trg_activities_forbid_update
  before update on activities
  for each row execute function forbid_activity_mutation();

create trigger trg_activities_forbid_delete
  before delete on activities
  for each row execute function forbid_activity_mutation();
