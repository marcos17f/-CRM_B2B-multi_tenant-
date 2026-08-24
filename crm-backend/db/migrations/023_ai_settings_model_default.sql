-- 023_ai_settings_model_default.sql
-- gemini-2.0-flash foi descontinuado pela Google (retorna 404 pedindo pra trocar por
-- gemini-3.6-flash) — corrige o default da coluna e migra quem já tinha o valor antigo.
alter table ai_settings alter column model set default 'gemini-3.6-flash';
update ai_settings set model = 'gemini-3.6-flash' where model = 'gemini-2.0-flash';
