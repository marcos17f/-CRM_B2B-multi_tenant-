-- 020_agro_permissions.sql
-- Concede às roles de sistema as permissões novas do vertical agro (products, equipment,
-- service_orders — ver src/common/permissions/catalog.ts). Plano/branding do workspace
-- ficam atrás de "workspace:manage", que hoje só "owner" tem (via "*") — decisão
-- deliberada: mudança de plano/cobrança é operação de dono, não de admin operacional.

update roles set permissions = permissions || '["products:read","products:write","equipment:read","equipment:write","service_orders:read","service_orders:write"]'::jsonb
where workspace_id is null and name = 'admin';

update roles set permissions = permissions || '["products:read","products:write","equipment:read","equipment:write","service_orders:read","service_orders:write"]'::jsonb
where workspace_id is null and name = 'sales_rep';

update roles set permissions = permissions || '["products:read","equipment:read","service_orders:read"]'::jsonb
where workspace_id is null and name = 'read_only';
