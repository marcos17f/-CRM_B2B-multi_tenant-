# Deploy — frontend no Vercel, backend no Railway

Este repo tem duas apps independentes (`frontend/` e `crm-backend/`). O jeito mais simples de
colocar no ar: **frontend estático no Vercel** + **backend (processo persistente) e Postgres no
Railway**. Vercel não hospeda Postgres nem roda um servidor Node de longa duração sem adaptação
— por isso o backend vai pro Railway, não pro Vercel.

## 1. Backend (Railway)

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → selecione
   este repositório.
2. Nas configurações do serviço criado, defina **Root Directory** = `crm-backend`.
   (`railway.json` já está nessa pasta com o build/start command corretos.)
3. No mesmo projeto Railway, clique **New** → **Database** → **Add PostgreSQL**. Isso cria a
   variável `DATABASE_URL` automaticamente dentro do projeto.
4. No serviço do backend, aba **Variables**, adicione:
   - `DATABASE_URL` → referencie a do Postgres: `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` → um valor forte e aleatório (ex.: gere com `openssl rand -hex 32`)
   - `JWT_ACCESS_TOKEN_TTL` → `15m`
   - `JWT_REFRESH_TOKEN_TTL` → `30d`
   - `NODE_ENV` → `production`

   (`PORT` é injetado automaticamente pelo Railway — não precisa setar.)
5. Deploy vai rodar sozinho. Depois do primeiro deploy com sucesso, aplique as migrations **uma
   vez** contra o banco de produção:
   ```bash
   npm i -g @railway/cli
   railway login
   railway link            # selecione este projeto/serviço
   railway run npm run db:migrate
   ```
6. **Não rode `npm run db:seed` em produção** — o seed cria um login de demonstração público
   (`demo@flow89.com` / `demo1234`). Crie sua conta real depois pelo próprio app, via
   `POST /auth/register` (ou pela tela de registro do frontend).
7. Copie a URL pública que o Railway gerou pro serviço (Settings → Networking → Generate
   Domain). Essa é a base da sua API (ex.: `https://seu-backend.up.railway.app`).

## 2. Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → importe o mesmo repositório.
2. **Root Directory** = `frontend`. O Vercel detecta Vite automaticamente (build `vite build`,
   output `dist`) — não precisa mexer em nada aqui.
3. Em **Environment Variables**, adicione:
   - `VITE_API_URL` → a URL do backend no Railway (sem barra no final), ex.:
     `https://seu-backend.up.railway.app`
4. Deploy. O `vercel.json` já incluído faz o fallback de rotas do React Router (sem ele, dar
   refresh em `/boards` ou `/contacts/:id` direto na URL cairia em 404).

## 3. Checklist pós-deploy

- Abra a URL do Vercel, registre um workspace de verdade em `/register`.
- Faça login, confira o Boards (drag-and-drop), Contatos, Inbox — tudo deve falar com o backend
  do Railway normalmente (CORS já está liberado via `app.enableCors()` no `main.ts`).
- Endireitar depois (não bloqueia o deploy, mas vale considerar):
  - Restringir CORS à origem exata do Vercel em vez de aceitar qualquer origem.
  - Configurar um domínio próprio no Vercel/Railway.

## Dev local não muda

`docker-compose.yml` (Postgres+Redis locais) e o fluxo `npm run start:dev` continuam iguais —
esses arquivos de deploy só entram em ação quando o Railway/Vercel builda a partir do Git.
