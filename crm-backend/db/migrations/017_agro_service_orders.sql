-- 017_agro_service_orders.sql
-- Ordens de serviço (assistência técnica/manutenção de máquinas) — a peça que falta entre
-- Task (genérico) e o fluxo real de campo: técnico designado, equipamento atendido, peças
-- usadas. Concluir uma ordem com peças debita estoque (ver ServiceOrdersService.complete
-- + inventory_movements, 018).

create table service_orders (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  company_id       uuid not null references companies(id),
  contact_id       uuid references contacts(id),
  equipment_id     uuid references equipment(id),
  type             text not null default 'maintenance' check (type in ('maintenance', 'repair', 'installation', 'inspection')),
  status           text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  description      text,
  technician_id    uuid references workspace_members(id),
  scheduled_date   timestamptz,
  completed_at     timestamptz,
  created_by       uuid references workspace_members(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_service_orders_workspace_status on service_orders (workspace_id, status);
create index idx_service_orders_equipment on service_orders (equipment_id);
create trigger trg_service_orders_updated_at before update on service_orders
  for each row execute function set_updated_at();

create table service_order_parts (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  service_order_id  uuid not null references service_orders(id) on delete cascade,
  product_id        uuid not null references products(id),
  description       text not null,
  quantity          numeric(14, 3) not null check (quantity > 0),
  unit_price        numeric(14, 2) not null check (unit_price >= 0),
  subtotal          numeric(14, 2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at        timestamptz not null default now()
);
create index idx_service_order_parts_order on service_order_parts (service_order_id);

alter table service_orders enable row level security;
alter table service_orders force row level security;
create policy tenant_isolation on service_orders
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

alter table service_order_parts enable row level security;
alter table service_order_parts force row level security;
create policy tenant_isolation on service_order_parts
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
