# CRM B2B multi-tenant — backend

Implementação funcional do modelo de dados + autenticação + permissões (RBAC) + pipeline
de vendas + histórico de atividades desenhados em `crm-arquitetura.md`. NestJS + Kysely +
PostgreSQL. Testado de ponta a ponta (migrations → seed → servidor → chamadas HTTP reais)
antes de ser entregue — veja "O que foi verificado" no final.

## Por que Kysely e não Prisma

O desenho original (seção 1 de `crm-arquitetura.md`) previa Prisma. Na hora de montar o
projeto de verdade, o ambiente onde ele foi construído não tinha acesso de rede ao CDN de
engines do Prisma (`binaries.prisma.sh`), então o Prisma CLI (generate/migrate) não
funcionava — só pacotes 100% JS/TS instaláveis via npm normal. A stack real ficou:

- **pg** — driver Postgres puro.
- **Kysely** — query builder tipado (sem engine nativo, sem geração de código via rede).
- **Migrations em SQL puro** (`db/migrations/*.sql`), aplicadas por um runner de ~50
  linhas (`db/migrate.ts`) que só depende do `pg`.

No seu ambiente isso provavelmente não vai ser um problema (Prisma funciona normalmente
com acesso de rede padrão) — mas como o objetivo era te entregar algo que eu realmente
testei rodando, preferi não montar em cima de uma ferramenta que eu não conseguia validar
aqui. Se quiser migrar pra Prisma depois, o schema SQL em `db/migrations/` é a fonte da
verdade e mapeia 1:1 pro que seria um `schema.prisma`.

## Stack

- **NestJS** (Express) + TypeScript
- **PostgreSQL 16** com **Row-Level Security** como defesa em profundidade
- **Kysely** (query builder tipado) — sem ORM com engine nativo
- **JWT** (access token 15min + refresh token opaco rotativo 30 dias) via scrypt nativo do
  Node para hash de senha (sem dependência de binário compilado tipo bcrypt/argon2)
- **Swagger/OpenAPI** em `/docs`

## Como rodar

```bash
cp .env.example .env          # ajuste se necessário
docker compose up -d          # sobe Postgres + Redis (Redis reservado pra Workflows/filas, ainda não usado)
npm install
npm run db:migrate            # aplica db/migrations/*.sql
npm run db:seed               # cria workspace + usuário de demonstração (idempotente)
npm run start:dev             # http://localhost:3000 — docs interativos em /docs
```

Login de demonstração criado pelo seed: **demo@flow89.com** / **demo1234** (workspace
`flow89-demo`, role `owner`).

Se preferir Postgres local em vez de Docker, só aponte `DATABASE_URL` no `.env` pro seu
banco — o runner de migrations não depende do Docker Compose, só de uma `DATABASE_URL`
válida.

## Estrutura

```
db/
  migrations/*.sql     — schema, na ordem em que devem ser aplicados
  migrate.ts           — runner (tabela _migrations controla o que já rodou)
  seed.ts              — dados de demonstração
  types.ts             — tipos Kysely (Database) espelhando as migrations
  kysely.ts            — factory do client Kysely (pg + CamelCasePlugin)
src/
  common/tenant/        — AsyncLocalStorage + TenantInterceptor (isolamento multi-tenant)
  common/guards/         — JwtAuthGuard, PermissionsGuard
  common/permissions/    — catálogo de permissões + roles de sistema
  common/security/       — hash de senha (scrypt), tokens opacos, parsing de duração
  database/              — DatabaseModule (client Kysely global) + TenantDb
  auth/                  — register, login, select-workspace, refresh, accept-invite
  members/                — convite e listagem de membros do workspace
  workspaces/, companies/, contacts/, campaigns/, pipelines/, opportunities/, tasks/,
  activities/             — um módulo Nest por recurso (controller + service + DTOs)
```

## Isolamento multi-tenant — como funciona de verdade

Duas camadas, como descrito na seção 1.1 do documento de arquitetura:

1. **Camada de aplicação**: todo service de recurso usa `TenantDb` (nunca o client cru),
   cujo `.db` só existe dentro do `AsyncLocalStorage` populado pelo `TenantInterceptor`.
   Toda query filtra `where workspaceId = ...` explicitamente.
2. **Row-Level Security no Postgres**: `TenantInterceptor` abre uma transação por request
   autenticada, roda `set_config('app.current_workspace_id', ...)` nela, e só then executa
   o resto do pipeline dentro dessa transação. As tabelas de dado de CRM (`companies`,
   `contacts`, `campaigns`, `pipelines`, `pipeline_stages`, `opportunities`,
   `opportunity_contact_roles`, `tasks`, `activities`, `teams`, `team_members`) têm RLS
   com `FORCE ROW LEVEL SECURITY` — mesmo esquecendo o filtro em algum service, o banco
   recusa.

**Exceção descoberta testando**: `workspace_members` e `roles` NÃO têm RLS (ver
`db/migrations/005_relax_identity_rls.sql`). O login precisa perguntar "de quais
workspaces esse usuário participa" — uma pergunta cross-tenant por natureza — antes de
saber qual `workspace_id` usar. RLS forçado nessas duas tabelas quebrava exatamente esse
fluxo (a query voltava vazia mesmo com dado no banco). Ficaram protegidas só pela camada
de aplicação, igual `users`/`workspaces`/`refresh_tokens`.

## Regras de negócio implementadas (não só documentadas)

- `POST /opportunities/:id/move-stage` recusa mover pra um estágio `lost` sem
  `lostReason` (400), recusa mover uma oportunidade já fechada (409), e grava uma
  `activity` tipo `stage_change` automaticamente.
- `PATCH /opportunities/:id` recusa editar campos de uma oportunidade fechada — é preciso
  chamar `POST /opportunities/:id/reopen` primeiro.
- `activities` é append-only até no banco: um trigger recusa `UPDATE`/`DELETE` na tabela,
  não só a ausência desses métodos na API.
- `POST /activities` só aceita os tipos "manuais" (`call`, `email`, `meeting`, `note`) —
  `stage_change`, `task_completed`, etc. só são gerados internamente pelos services.
- Convite de membro cria o `workspace_member` com `status: invited`; a pessoa só vira
  `active` ao chamar `/auth/accept-invite` com o token que `/members/invite` devolve.

## O que ainda falta (próximos passos do roadmap, na sua ordem)

Feito: **Banco de dados, Autenticação, Permissões (RBAC de sistema — roles customizáveis
por workspace ficam pra depois), Pipeline de vendas, Histórico de atividades, API**
(REST + validação + Swagger).

Pendente: **Frontend** (o print do Flow89 que você mandou — dá pra alinhar os endpoints
com essas telas quando quiser seguir), **Workflows** (automações/triggers configuráveis —
hoje as únicas automações são as que estão hard-coded nos services, tipo logging de
activity), **Agentes de IA** (as "sugestões críticas" e "aprovações IA" do Inbox do
Flow89 — nada disso existe ainda no backend).

Também deliberadamente fora de escopo por ora: envio de e-mail transacional real pro
convite (a API devolve o token/link, plugar um provedor tipo Resend/SES é trabalho de
Workflows), roles customizáveis por workspace (só as 4 roles de sistema — owner, admin,
sales_rep, read_only — existem hoje), catálogo/validação de custom fields.

## O que foi verificado

Rodado neste ambiente antes da entrega, não só escrito:

- `npx tsc --noEmit` limpo e `nest build` limpo.
- Migrations aplicadas num Postgres real (`npm run db:migrate`), incluindo a correção do
  005 depois de um bug real encontrado testando login.
- Seed rodado com sucesso (`npm run db:seed`).
- Servidor subiu e respondeu em `/health` e `/docs`.
- Fluxo completo via HTTP real: login → listar companies → criar oportunidade → tentar
  fechar como "lost" sem motivo (400) → ganhar a oportunidade → tentar editar oportunidade
  fechada (409) → conferir a timeline de activities gerada automaticamente.
- **Isolamento entre tenants**: registrado um segundo workspace, confirmado que ele começa
  vazio, que uma empresa criada nele não aparece pro primeiro workspace nem é acessível
  por ID (404), e que RLS bloqueia a leitura de `workspace_members` sem o contexto de
  tenant certo mesmo direto via `psql`.
- Convite de membro → aceitar convite → login como o novo membro → confirmado que o role
  `sales_rep` NÃO consegue chamar `/members/invite` (403, falta `members:manage`) mas
  consegue listar `companies` (tem `companies:read`).
- Rotação de refresh token: usar um refresh token duas vezes falha na segunda (401).
