-- 021_ai_settings.sql
-- Configuração da "Central de I.A." por workspace (guia Configurações seção 5) — chave de
-- API, modelo, e toggles do agente autônomo. Um registro por workspace (singleton),
-- separado de ai_suggestions (007) que é heurística sem LLM nenhum. api_key fica em texto
-- plano, mesma ressalva de produção já feita em integration_connections (migration 011).

create table ai_settings (
  workspace_id        uuid primary key references workspaces(id) on delete cascade,
  provider            text not null default 'gemini' check (provider in ('gemini')),
  api_key             text,
  -- chave geral: desliga tudo de IA de uma vez, independente do resto
  enabled             boolean not null default false,
  -- agente responde autonomamente no WhatsApp (transbordo pra humano quando desligado/sem key)
  agent_enabled       boolean not null default false,
  model               text not null default 'gemini-2.0-flash',
  thinking_mode       boolean not null default false,
  search_grounding    boolean not null default false,
  lgpd_consent_at     timestamptz,
  telegram_bot_token  text,
  telegram_chat_id    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger trg_ai_settings_updated_at before update on ai_settings
  for each row execute function set_updated_at();

alter table ai_settings enable row level security;
alter table ai_settings force row level security;
create policy tenant_isolation on ai_settings
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
