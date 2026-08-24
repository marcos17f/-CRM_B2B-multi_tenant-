-- 015_opportunity_line_items.sql
-- Itens de linha de uma Opportunity (máquina X, N sacas de semente Y...). Quando existem
-- line items, opportunities.amount passa a ser recalculado automaticamente pela app a
-- partir da soma deles (ver OpportunityLineItemsService) — sem line items, amount
-- continua editável direto como já era.

create table opportunity_line_items (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references workspaces(id) on delete cascade,
  opportunity_id  uuid not null references opportunities(id) on delete cascade,
  product_id      uuid references products(id),
  -- snapshot do nome do produto no momento em que foi adicionado — não muda retroativamente
  -- se o produto for renomeado depois (histórico de proposta fica estável).
  description     text not null,
  quantity        numeric(14, 3) not null check (quantity > 0),
  unit_price      numeric(14, 2) not null check (unit_price >= 0),
  subtotal        numeric(14, 2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at      timestamptz not null default now()
);
create index idx_opportunity_line_items_opportunity on opportunity_line_items (opportunity_id);
create index idx_opportunity_line_items_workspace on opportunity_line_items (workspace_id);

alter table opportunity_line_items enable row level security;
alter table opportunity_line_items force row level security;
create policy tenant_isolation on opportunity_line_items
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
