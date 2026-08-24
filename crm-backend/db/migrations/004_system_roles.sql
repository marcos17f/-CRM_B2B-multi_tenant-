-- 004_system_roles.sql
-- Roles de sistema (workspace_id null), compartilhadas por todos os workspaces — ver
-- src/common/permissions/catalog.ts para o significado de cada permissão. Todo workspace
-- novo referencia estas linhas para seu primeiro membro (owner); roles customizadas por
-- workspace (workspace_id preenchido) são um recurso da seção 3 (Permissões), ainda não
-- implementado na API.

create unique index if not exists uq_system_role_name on roles (name) where workspace_id is null;

insert into roles (workspace_id, name, is_system, permissions) values
  (null, 'owner', true, '["*"]'::jsonb),
  (null, 'admin', true, '["companies:*","contacts:*","campaigns:*","pipelines:*","opportunities:*","tasks:*","activities:*","members:manage"]'::jsonb),
  (null, 'sales_rep', true, '["companies:read","companies:write","contacts:read","contacts:write","campaigns:read","pipelines:read","opportunities:read","opportunities:write","tasks:read","tasks:write","activities:read","activities:write"]'::jsonb),
  (null, 'read_only', true, '["companies:read","contacts:read","campaigns:read","pipelines:read","opportunities:read","tasks:read","activities:read"]'::jsonb)
on conflict (name) where workspace_id is null do nothing;
