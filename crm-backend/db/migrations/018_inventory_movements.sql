-- 018_inventory_movements.sql
-- Log imutável de movimentos de estoque (mesmo padrão append-only de activities, 002) —
-- toda vez que stock_quantity de um product muda, fica um rastro de por quê.

create table inventory_movements (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references workspaces(id) on delete cascade,
  product_id       uuid not null references products(id),
  type             text not null check (type in ('sale', 'service_use', 'adjustment', 'restock')),
  -- negativo = saída (venda/uso em serviço), positivo = entrada (restock/ajuste positivo)
  quantity_delta   numeric(14, 3) not null,
  related_to_type  text check (related_to_type in ('opportunity', 'service_order')),
  related_to_id    uuid,
  actor_id         uuid references workspace_members(id),
  note             text,
  created_at       timestamptz not null default now()
);
create index idx_inventory_movements_workspace_product on inventory_movements (workspace_id, product_id, created_at desc);

alter table inventory_movements enable row level security;
alter table inventory_movements force row level security;
create policy tenant_isolation on inventory_movements
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

create or replace function forbid_inventory_movement_mutation()
returns trigger as $$
begin
  raise exception 'inventory_movements é append-only: % não é permitido (registre um movimento de ajuste em vez de editar/apagar)', tg_op;
end;
$$ language plpgsql;

create trigger trg_inventory_movements_forbid_update
  before update on inventory_movements
  for each row execute function forbid_inventory_movement_mutation();

create trigger trg_inventory_movements_forbid_delete
  before delete on inventory_movements
  for each row execute function forbid_inventory_movement_mutation();
