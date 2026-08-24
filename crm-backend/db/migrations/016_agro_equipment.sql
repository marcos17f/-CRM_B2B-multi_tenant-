-- 016_agro_equipment.sql
-- Cadastro de equipamento por cliente (seção "cadastro de equipamento" do pedido de
-- verticalização agro) — máquina que uma Company possui, usada como histórico de
-- manutenção (service_orders, 017) e ponto de partida pra upsell de peças.

create table equipment (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  company_id      uuid not null references companies(id) on delete cascade,
  -- referência ao modelo no catálogo, se ele estiver cadastrado como product (category='machine')
  product_id      uuid references products(id),
  name            text not null,
  manufacturer    text,
  model           text,
  serial_number   text,
  purchase_date   date,
  status          text not null default 'active' check (status in ('active', 'inactive', 'sold')),
  custom_fields   jsonb not null default '{}',
  created_by      uuid references workspace_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_equipment_workspace_company on equipment (workspace_id, company_id);
create trigger trg_equipment_updated_at before update on equipment
  for each row execute function set_updated_at();

alter table equipment enable row level security;
alter table equipment force row level security;
create policy tenant_isolation on equipment
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
