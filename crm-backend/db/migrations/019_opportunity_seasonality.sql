-- 019_opportunity_seasonality.sql
-- Sazonalidade agrícola: safra/cultura na Opportunity, pra planejar vendas de sementes e
-- insumos por época do ano (ver GET /reports/seasonality). E abre related_to_type de
-- activities/tasks pra equipment e service_order, que passaram a existir em 016/017.

alter table opportunities add column season text;       -- ex.: "2026/2027"
alter table opportunities add column crop_type text;     -- ex.: "soja", "milho", "algodão"

alter table activities drop constraint activities_related_to_type_check;
alter table activities add constraint activities_related_to_type_check check (related_to_type in (
  'company', 'contact', 'opportunity', 'equipment', 'service_order'
));

alter table tasks drop constraint tasks_related_to_type_check;
alter table tasks add constraint tasks_related_to_type_check check (related_to_type in (
  'company', 'contact', 'opportunity', 'equipment', 'service_order'
));
