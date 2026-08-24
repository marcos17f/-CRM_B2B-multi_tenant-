-- 013_plans.sql
-- Catálogo de planos (SaaS multi-cliente) + liga workspaces.plan_id a ele. Não é
-- tenant-scoped — é um catálogo global, igual "roles" de sistema (workspace_id null).
-- Cobrança de verdade (Stripe etc.) fica fora daqui — isto só modela limites de uso por
-- plano; ver PlansService.assertWithinLimit.

create table plans (
  id                    text primary key,
  name                  text not null,
  -- null = preço sob consulta ("fale conosco", ex.: enterprise)
  monthly_price_cents   int,
  -- null em qualquer limite = ilimitado
  max_seats             int,
  max_companies         int,
  max_contacts          int,
  max_opportunities     int,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

insert into plans (id, name, monthly_price_cents, max_seats, max_companies, max_contacts, max_opportunities) values
  ('free', 'Free', 0, 2, 50, 100, 50),
  ('starter', 'Starter', 9900, 5, 500, 2000, 500),
  ('pro', 'Pro', 29900, 20, 5000, 20000, 5000),
  ('enterprise', 'Enterprise', null, null, null, null, null)
on conflict (id) do nothing;

update workspaces set plan_id = 'free' where plan_id is null;
alter table workspaces alter column plan_id set default 'free';
alter table workspaces add constraint fk_workspaces_plan foreign key (plan_id) references plans(id);
