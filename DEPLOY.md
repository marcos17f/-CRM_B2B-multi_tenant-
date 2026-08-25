# Deploy — frontend no Vercel, backend no Render, banco no Neon

Este repo tem duas apps independentes (`frontend/` e `crm-backend/`). Combinação **100%
gratuita, sem cartão de crédito**: **frontend estático no Vercel** + **backend no Render**
(free tier — dorme após 15 min sem uso, primeira requisição depois disso demora ~30-60s pra
acordar) + **Postgres no Neon** (free tier permanente, sem expiração).

> Havia uma versão anterior deste guia usando Railway — o free tier do Railway deixou de
> existir (virou modelo de créditos/trial), por isso a troca pra Render + Neon.
> `crm-backend/railway.json` ficou no repo sem uso; pode ignorar ou remover.

## 1. Banco de dados (Neon)

1. [neon.tech](https://neon.tech) → crie uma conta (sem cartão) → **New Project**.
2. Copie a **Connection string** (algo como
   `postgresql://usuario:senha@ep-xxx.neon.tech/nomedobanco?sslmode=require`) — essa é a sua
   `DATABASE_URL` de produção. Guarde, você vai usar nos passos seguintes.

## 2. Backend (Render)

1. [render.com](https://render.com) → crie uma conta (dá pra usar login do GitHub, já que seu
   código está lá) → **New** → **Web Service** → conecte o repositório
   `marcos17f/-CRM_B2B-multi_tenant-`.
2. **Root Directory** = `crm-backend`.
3. **Build Command** = `npm run build`
4. **Start Command** = `npm run start:prod`
5. **Instance Type** = Free
6. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → a connection string do Neon (passo 1)
   - `JWT_SECRET` → um valor forte e aleatório (ex.: gere com `openssl rand -hex 32`)
   - `JWT_ACCESS_TOKEN_TTL` → `15m`
   - `JWT_REFRESH_TOKEN_TTL` → `30d`
   - `NODE_ENV` → `production`

   (`PORT` é injetado automaticamente pelo Render — não precisa setar.)
7. Em **Health Check Path**, configure `/health`.
8. Deploy. Depois do primeiro deploy com sucesso, aplique as migrations **uma vez** contra o
   banco do Neon — mais simples rodando local, apontando pra connection string de produção:
   ```bash
   cd crm-backend
   DATABASE_URL="<connection string do Neon>" npm run db:migrate
   ```
   (No PowerShell: `$env:DATABASE_URL="<connection string>"; npm run db:migrate`)
9. **Não rode `npm run db:seed` em produção** — o seed cria um login de demonstração público
   (`demo@flow89.com` / `demo1234`). Crie sua conta real depois pelo próprio app, via
   `POST /auth/register` (ou pela tela de registro do frontend).
10. Copie a URL pública que o Render gerou pro serviço (algo como
    `https://seu-backend.onrender.com`). Essa é a base da sua API.

## 3. Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → importe o mesmo repositório
   (se já não tiver feito isso).
2. **Root Directory** = `frontend`. O Vercel detecta Vite automaticamente (build `vite build`,
   output `dist`) — não precisa mexer em nada aqui.
3. Em **Settings → Environment Variables**, adicione (ou edite, se já existir):
   - `VITE_API_URL` → a URL do backend no Render (sem barra no final), ex.:
     `https://seu-backend.onrender.com`
4. Depois de salvar a variável, force um **Redeploy** (Vercel não aplica env var nova em builds
   já existentes — precisa rodar de novo). O `vercel.json` já incluído faz o fallback de rotas
   do React Router (sem ele, dar refresh em `/boards` ou `/contacts/:id` direto na URL cairia em
   404).

## 4. Checklist pós-deploy

- Abra a URL do Vercel (funciona de qualquer rede, celular incluso), registre um workspace de
  verdade em `/register`.
- Primeira requisição pode demorar ~30-60s (o Render "acordando" o backend que estava dormindo)
  — normal no free tier, não é erro.
- Faça login, confira o Boards (drag-and-drop), Contatos, Inbox — tudo deve falar com o backend
  do Render normalmente (CORS já está liberado via `app.enableCors()` no `main.ts`).
- Endireitar depois (não bloqueia o deploy, mas vale considerar):
  - Restringir CORS à origem exata do Vercel em vez de aceitar qualquer origem.
  - Configurar um domínio próprio no Vercel/Render.
  - Se o "dormir" do Render incomodar no dia a dia: um ping externo periódico (ex.:
    [cron-job.org](https://cron-job.org) batendo em `/health` a cada 10 min) mantém o backend
    acordado, ou migrar pro tier pago do Render remove o problema de vez.

## Dev local não muda

`docker-compose.yml` (Postgres+Redis locais) e o fluxo `npm run start:dev` continuam iguais —
esses arquivos de deploy só entram em ação quando o Render/Vercel builda a partir do Git.
