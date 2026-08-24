-- 007_ai_suggestions.sql
-- Agentes de IA (seção "roadmap" do README) — primeira fatia: sem chamada real a um
-- modelo de linguagem (evita custo/latência/chave de API). AiService gera estas linhas a
-- partir de heurísticas de negócio sobre dados que já existem (oportunidades sem
-- atividade recente, etc.) — ver src/ai/ai.service.ts. `rule_key` identifica de forma
-- estável qual heurística gerou a sugestão, pra permitir upsert idempotente (não duplicar
-- a mesma sugestão a cada GET) e auto-resolver quando a condição deixa de valer.

create table ai_suggestions (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  kind              text not null check (kind in ('suggestion', 'approval')),
  rule_key          text not null,
  related_to_type   text not null check (related_to_type in ('company', 'contact', 'opportunity')),
  related_to_id     uuid not null,
  severity          text not null default 'normal' check (severity in ('normal', 'critical')),
  title             text not null,
  description       text not null,
  payload           jsonb not null default '{}',
  status            text not null default 'pending' check (status in ('pending', 'approved', 'dismissed')),
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

create unique index uq_ai_suggestions_pending_rule
  on ai_suggestions (workspace_id, rule_key, related_to_type, related_to_id)
  where status = 'pending';

create index idx_ai_suggestions_workspace_status on ai_suggestions (workspace_id, status);

alter table ai_suggestions enable row level security;
alter table ai_suggestions force row level security;
create policy tenant_isolation on ai_suggestions
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
