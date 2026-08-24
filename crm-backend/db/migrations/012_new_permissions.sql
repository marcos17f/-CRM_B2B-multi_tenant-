-- 012_new_permissions.sql
-- Concede às roles de sistema existentes as permissões novas introduzidas pelo guia
-- RFM/Segmentação/Priorização/WhatsApp (ver src/common/permissions/catalog.ts). `owner`
-- já tem "*" e não precisa de update. Duplicar uma permissão já presente é inofensivo
-- (hasPermission() só faz .includes()).

update roles set permissions = permissions || '["reports:read","segments:read","segments:write","integrations:manage","whatsapp:send"]'::jsonb
where workspace_id is null and name = 'admin';

update roles set permissions = permissions || '["reports:read","segments:read","whatsapp:send"]'::jsonb
where workspace_id is null and name = 'sales_rep';

update roles set permissions = permissions || '["reports:read","segments:read"]'::jsonb
where workspace_id is null and name = 'read_only';
