-- 022_ai_permissions.sql
update roles set permissions = permissions || '["ai:manage"]'::jsonb
where workspace_id is null and name = 'admin';
