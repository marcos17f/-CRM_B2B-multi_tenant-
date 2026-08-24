-- 001_core_tenancy.sql
-- Workspaces, identidade global (users), identidade por tenant (workspace_members),
-- roles/RBAC, times e refresh tokens. Ver crm-arquitetura.md seções 1 e 2.

create extension if not exists pgcrypto; -- gen_random_uuid() já é built-in no PG13+, mantido por segurança
create extension if not exists citext;   -- e-mail case-insensitive (users.email, contacts.email)

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- workspaces (o tenant)
-- ---------------------------------------------------------------------------
create table workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  status      text not null default 'trial' check (status in ('trial', 'active', 'suspended', 'cancelled')),
  plan_id     text,
  settings    jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_workspaces_updated_at before update on workspaces
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- users (identidade global — pode pertencer a vários workspaces)
-- ---------------------------------------------------------------------------
create table users (
  id                  uuid primary key default gen_random_uuid(),
  email               citext not null unique,
  email_verified_at   timestamptz,
  password_hash       text,
  name                text not null,
  avatar_url          text,
  status              text not null default 'active' check (status in ('active', 'disabled')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- roles (RBAC) — workspace_id null = role de sistema/template
-- ---------------------------------------------------------------------------
create table roles (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid references workspaces(id) on delete cascade,
  name          text not null,
  is_system     boolean not null default false,
  permissions   jsonb not null default '[]',
  created_at    timestamptz not null default now()
);
create index idx_roles_workspace on roles (workspace_id);

-- ---------------------------------------------------------------------------
-- workspace_members (identidade dentro do tenant — owner_id de tudo aponta pra cá)
-- ---------------------------------------------------------------------------
create table workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  role_id       uuid not null references roles(id),
  status        text not null default 'invited' check (status in ('invited', 'active', 'deactivated')),
  invited_by    uuid references workspace_members(id),
  joined_at     timestamptz,
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);
create index idx_workspace_members_workspace on workspace_members (workspace_id);
create index idx_workspace_members_user on workspace_members (user_id);

-- ---------------------------------------------------------------------------
-- teams (hierarquia/território — usado por permissões e forecasting)
-- ---------------------------------------------------------------------------
create table teams (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  name            text not null,
  parent_team_id  uuid references teams(id),
  created_at      timestamptz not null default now()
);
create index idx_teams_workspace on teams (workspace_id);

create table team_members (
  team_id               uuid not null references teams(id) on delete cascade,
  workspace_member_id   uuid not null references workspace_members(id) on delete cascade,
  primary key (team_id, workspace_member_id)
);

-- ---------------------------------------------------------------------------
-- refresh_tokens (sessão de login; access token é um JWT stateless separado)
-- ---------------------------------------------------------------------------
create table refresh_tokens (
  id                    uuid primary key default gen_random_uuid(),
  workspace_member_id   uuid not null references workspace_members(id) on delete cascade,
  token_hash            text not null,
  revoked_at            timestamptz,
  expires_at            timestamptz not null,
  created_at            timestamptz not null default now()
);
create index idx_refresh_tokens_member on refresh_tokens (workspace_member_id);
