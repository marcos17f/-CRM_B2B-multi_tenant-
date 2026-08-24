-- 014_agro_products.sql
-- Catálogo de produtos vendáveis pro vertical agro (máquinas, sementes, grãos, peças) e
-- também serviços (mão de obra). Vira item de linha em Opportunity (015) e em ordens de
-- serviço (017).

create table products (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  sku             text not null,
  name            text not null,
  category        text not null check (category in ('machine', 'seed', 'grain', 'part', 'service')),
  unit            text not null default 'un',
  price           numeric(14, 2) not null default 0,
  -- serviços normalmente não têm estoque — track_stock=false pra esses (decidido na app,
  -- ver ProductsService.create), mas fica configurável por produto.
  track_stock     boolean not null default true,
  stock_quantity  numeric(14, 3) not null default 0,
  status          text not null default 'active' check (status in ('active', 'discontinued')),
  custom_fields   jsonb not null default '{}',
  created_by      uuid references workspace_members(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (workspace_id, sku)
);
create index idx_products_workspace on products (workspace_id);
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();

alter table products enable row level security;
alter table products force row level security;
create policy tenant_isolation on products
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
