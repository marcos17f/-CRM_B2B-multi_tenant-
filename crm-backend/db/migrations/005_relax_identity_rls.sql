-- 005_relax_identity_rls.sql
--
-- Corrige um bug real encontrado testando o fluxo de login de ponta a ponta: POST
-- /auth/login precisa descobrir "de quais workspaces esse usuário participa" ANTES de
-- saber qual workspace_id usar — é uma pergunta inerentemente cross-tenant, sobre a
-- identidade da pessoa, não sobre dados de um tenant específico. Com RLS forçado em
-- workspace_members (e roles, consultada no mesmo join), essa query sempre voltava vazia
-- fora de uma transação com `app.current_workspace_id` já setado — que é exatamente o
-- que login() ainda não sabe nesse ponto. Login falhava com "sem workspace ativo" mesmo
-- com o membership existindo no banco.
--
-- Correção: workspace_members e roles passam a depender só da camada de aplicação
-- (TenantDb já filtra por workspace_id explicitamente em toda query de recurso) — o
-- mesmo padrão já usado para users/workspaces/refresh_tokens (ver 003, comentário
-- inicial). As tabelas de dado de CRM propriamente ditas (companies, contacts,
-- opportunities, tasks, activities, campaigns, pipelines, teams e suas tabelas de junção)
-- continuam com RLS forçado — é ali que uma falha de isolamento teria o impacto real.

alter table workspace_members disable row level security;
alter table workspace_members no force row level security;
drop policy if exists tenant_isolation on workspace_members;

alter table roles disable row level security;
alter table roles no force row level security;
drop policy if exists tenant_isolation on roles;
