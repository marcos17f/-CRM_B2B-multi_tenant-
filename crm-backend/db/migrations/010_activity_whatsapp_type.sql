-- 010_activity_whatsapp_type.sql
-- Adiciona 'whatsapp' aos tipos aceitos em activities.type (guia RFM/Segmentação/WhatsApp
-- seção 4) — registrado tanto manualmente (POST /activities) quanto automaticamente pelo
-- módulo de integração WhatsApp (mensagens enviadas/recebidas, ver 011_whatsapp_integration.sql).

alter table activities drop constraint activities_type_check;
alter table activities add constraint activities_type_check check (type in (
  'call', 'email', 'meeting', 'note', 'whatsapp',
  'stage_change', 'field_change', 'task_created', 'task_completed', 'ai_suggestion', 'system'
));
