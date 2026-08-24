-- 011_whatsapp_integration.sql
-- Conexão real com WhatsApp Business Platform (Meta Cloud API) — guia RFM/Segmentação/
-- WhatsApp seção 4, "integração de verdade". `integration_connections` é genérica por
-- provider pra caber outras integrações no futuro (mesmo padrão do guia de integrações
-- anterior); hoje só 'whatsapp' é aceito.
--
-- access_token fica em texto plano nesta tabela — igual ao resto do projeto (ver
-- JWT_SECRET em .env.example), isto é um backend de desenvolvimento sem KMS/secrets
-- manager. Endureça isso (criptografia em repouso, rotação) antes de produção real.

create table integration_connections (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  provider       text not null check (provider in ('whatsapp')),
  -- phone_number_id do Meta Cloud API — é a chave que o webhook usa pra descobrir a que
  -- workspace um evento pertence (ver WhatsappWebhookService.resolveConnection).
  external_id    text not null,
  waba_id        text,
  display_phone  text,
  access_token   text not null,
  status         text not null default 'active' check (status in ('active', 'disconnected')),
  connected_by   uuid references workspace_members(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (workspace_id, provider),
  unique (provider, external_id)
);
create index idx_integration_connections_workspace on integration_connections (workspace_id);
create trigger trg_integration_connections_updated_at before update on integration_connections
  for each row execute function set_updated_at();

create table whatsapp_messages (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  -- id da mensagem no WhatsApp ("wamid...") — usado pra dedupe de retries do webhook e
  -- pra correlacionar status de entrega/leitura recebidos depois.
  wamid         text not null,
  direction     text not null check (direction in ('inbound', 'outbound')),
  contact_id    uuid references contacts(id) on delete set null,
  activity_id   uuid references activities(id) on delete set null,
  status        text not null default 'received' check (status in ('received', 'sent', 'delivered', 'read', 'failed')),
  created_at    timestamptz not null default now(),
  unique (workspace_id, wamid)
);
create index idx_whatsapp_messages_workspace on whatsapp_messages (workspace_id);

alter table integration_connections enable row level security;
alter table integration_connections force row level security;
create policy tenant_isolation on integration_connections
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

-- O webhook do WhatsApp (POST /webhooks/whatsapp) chega sem tenant resolvido — a Meta
-- manda todos os eventos de todos os workspaces pra uma única URL, e o phone_number_id
-- dentro do payload é o único jeito de descobrir de qual workspace é. Esta policy libera
-- SELECT só quando a flag de sessão abaixo está setada explicitamente — o que só
-- acontece dentro de WhatsappWebhookService.resolveConnection, nunca no fluxo autenticado
-- normal (TenantInterceptor nunca seta essa flag) — então não enfraquece o isolamento das
-- rotas normais de CRUD desta tabela.
create policy webhook_lookup on integration_connections
  for select
  using (current_setting('app.whatsapp_webhook_lookup', true) = 'true');

alter table whatsapp_messages enable row level security;
alter table whatsapp_messages force row level security;
create policy tenant_isolation on whatsapp_messages
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
