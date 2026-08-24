-- 003_row_level_security.sql
--
-- Camada de defesa em profundidade (seção 1.1 do documento de arquitetura). A aplicação
-- já filtra por workspace_id em toda query (ver db/repositories/*.ts); isso aqui garante
-- que, mesmo que um bug esqueça o filtro, o Postgres recusa o acesso cross-tenant —
-- desde que a conexão tenha `app.current_workspace_id` setado via `set_config(...)`.
--
-- Quem seta essa variável de sessão: TenantInterceptor (src/common/tenant), uma vez por
-- request autenticada, dentro de uma transação Kysely. Rotas pré-tenant (login, registro,
-- refresh) e o seed script usam o client "raw" e não passam por RLS nas tabelas que não
-- têm workspace_id direto (users, workspaces, refresh_tokens) — não há dado de CRM lá.
--
-- FORCE ROW LEVEL SECURITY é necessário porque o papel `crm` é o dono das tabelas
-- (rodou as migrations), e donos de tabela por padrão *ignoram* RLS a menos que FORCE
-- esteja habilitado.

-- ---- tabelas com workspace_id direto ----
do $$
declare
  t text;
begin
  foreach t in array array[
    'roles', 'workspace_members', 'teams',
    'companies', 'contacts', 'campaigns', 'pipelines',
    'opportunities', 'tasks', 'activities'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

create policy tenant_isolation on roles
  using (workspace_id is null or workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id is null or workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on workspace_members
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on teams
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on companies
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on contacts
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on campaigns
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on pipelines
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on opportunities
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on tasks
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create policy tenant_isolation on activities
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

-- ---- tabelas escopadas indiretamente (via FK para uma tabela com workspace_id) ----

alter table pipeline_stages enable row level security;
alter table pipeline_stages force row level security;
create policy tenant_isolation on pipeline_stages
  using (exists (
    select 1 from pipelines p
    where p.id = pipeline_stages.pipeline_id
      and p.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ))
  with check (exists (
    select 1 from pipelines p
    where p.id = pipeline_stages.pipeline_id
      and p.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ));

alter table team_members enable row level security;
alter table team_members force row level security;
create policy tenant_isolation on team_members
  using (exists (
    select 1 from teams tm
    where tm.id = team_members.team_id
      and tm.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ))
  with check (exists (
    select 1 from teams tm
    where tm.id = team_members.team_id
      and tm.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ));

alter table opportunity_contact_roles enable row level security;
alter table opportunity_contact_roles force row level security;
create policy tenant_isolation on opportunity_contact_roles
  using (exists (
    select 1 from opportunities o
    where o.id = opportunity_contact_roles.opportunity_id
      and o.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ))
  with check (exists (
    select 1 from opportunities o
    where o.id = opportunity_contact_roles.opportunity_id
      and o.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ));
