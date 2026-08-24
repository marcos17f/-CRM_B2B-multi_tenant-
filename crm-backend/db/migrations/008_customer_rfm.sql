-- 008_customer_rfm.sql
-- Snapshots calculados de RFM (Recência/Frequência/Valor) por company — ver guia
-- "RFM, Segmentação e Priorização de Clientes" seção 1. Recalculado sob demanda via
-- RfmService.recompute (POST /reports/rfm/recompute), não em tempo real: histórico é
-- preservado (um computed_at novo a cada rodada) para dar pra ver evolução do segmento.

create table customer_rfm_snapshots (
  id                        uuid primary key default gen_random_uuid(),
  workspace_id              uuid not null references workspaces(id) on delete cascade,
  company_id                uuid not null references companies(id) on delete cascade,
  computed_at               timestamptz not null default now(),
  period_months             int not null default 12,

  last_purchase_at          timestamptz,
  recency_days              int,
  frequency_count           int not null default 0,
  monetary_total            numeric(14, 2) not null default 0,
  -- valor histórico total (sem janela de period_months) — usado pela tela de priorização
  -- (seção 3 do guia), não entra no cálculo de quintil (que compara só dentro da janela).
  lifetime_monetary_total   numeric(14, 2) not null default 0,

  recency_score             smallint,
  frequency_score           smallint,
  monetary_score            smallint,
  rfm_segment               text,

  unique (workspace_id, company_id, computed_at)
);
create index idx_customer_rfm_snapshots_lookup on customer_rfm_snapshots (workspace_id, company_id, computed_at desc);

alter table customer_rfm_snapshots enable row level security;
alter table customer_rfm_snapshots force row level security;
create policy tenant_isolation on customer_rfm_snapshots
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
