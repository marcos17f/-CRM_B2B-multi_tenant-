-- 009_segments.sql
-- Segmentação de clientes (guia "RFM, Segmentação e Priorização" seção 2). Dois tipos:
-- `manual` (membros adicionados à mão) e `smart` (critério em `criteria`, jsonb avaliado
-- contra companies + o snapshot RFM mais recente — ver SegmentsService.evaluateSmartSegment).
-- Segmentos smart têm `segment_members` recalculado do zero (delete + insert) a cada
-- POST /segments/:id/recompute.

create table segments (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  name          text not null,
  type          text not null check (type in ('manual', 'smart')),
  criteria      jsonb,
  created_by    uuid references workspace_members(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint chk_smart_segment_has_criteria check (type <> 'smart' or criteria is not null)
);
create index idx_segments_workspace on segments (workspace_id);
create trigger trg_segments_updated_at before update on segments
  for each row execute function set_updated_at();

create table segment_members (
  segment_id    uuid not null references segments(id) on delete cascade,
  company_id    uuid not null references companies(id) on delete cascade,
  added_at      timestamptz not null default now(),
  primary key (segment_id, company_id)
);

alter table segments enable row level security;
alter table segments force row level security;
create policy tenant_isolation on segments
  using (workspace_id = current_setting('app.current_workspace_id', true)::uuid)
  with check (workspace_id = current_setting('app.current_workspace_id', true)::uuid);

alter table segment_members enable row level security;
alter table segment_members force row level security;
create policy tenant_isolation on segment_members
  using (exists (
    select 1 from segments s
    where s.id = segment_members.segment_id
      and s.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ))
  with check (exists (
    select 1 from segments s
    where s.id = segment_members.segment_id
      and s.workspace_id = current_setting('app.current_workspace_id', true)::uuid
  ));
