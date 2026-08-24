-- 006_workflows.sql
-- Workflows (seção "roadmap" do README) — primeira fatia: automações fixas embutidas no
-- código (ver src/workflows/workflows.definitions.ts), não um motor genérico de regras
-- configuráveis. Esta tabela só guarda se cada automação fixa está ligada/desligada por
-- workspace; a lógica de quando disparar cada uma vive em WorkflowsService.

create table workflow_settings (
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  workflow_key  text not null,
  enabled       boolean not null default true,
  updated_at    timestamptz not null default now(),
  primary key (workspace_id, workflow_key)
);

alter table workflow_settings enable row level security;
alter table workflow_settings force row level security;
create policy tenant_isolation on workflow_settings
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create trigger trg_workflow_settings_updated_at before update on workflow_settings
  for each row execute function set_updated_at();
