# AdPageOps

SaaS multi-tenant para monitorar contas do Meta Ads, inventariar anúncios e agrupar por Página (page_id / instagram_actor_id), com painel, histórico e alertas.

## Push-and-go

- **CI**: push em `main` dispara lint, typecheck, tests e build (`.github/workflows/ci.yml`).
- **Migrations**: push em `main` com mudanças em `supabase/migrations/**` aplica migrations no Supabase via GitHub Actions. Não é necessário rodar migrations manualmente em produção.
- **Deploy**: Railway conectado ao repo faz autodeploy dos 3 services (web, api, worker).

## Stack

- **Monorepo**: pnpm workspaces
- **apps/web**: Next.js 14 (App Router), Tailwind, React Query
- **apps/api**: NestJS, Prisma, BullMQ
- **apps/worker**: BullMQ workers (inventory, insights, alerts)
- **packages/shared**: types, validators, status, saturation, Meta client
- **Banco**: PostgreSQL (Supabase em prod; Docker local)
- **Cache/Fila**: Redis (Railway em prod; Docker local)

## Pré-requisitos

- Node 20+
- pnpm 9+
- Docker (Postgres + Redis local)

## Rodar local

1. **Subir Postgres e Redis**
   ```bash
   docker-compose up -d
   ```

2. **Variáveis de ambiente**
   - Copie `apps/api/.env.example` para `apps/api/.env` e preencha.
   - Na raiz, crie `.env` ou exporte:
     - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adpageops`
     - `REDIS_HOST=localhost` `REDIS_PORT=6379`
     - `JWT_SECRET` e `TOKEN_ENCRYPTION_KEY`
     - Para Meta OAuth: `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` (ex: `http://localhost:4000/integrations/meta/callback`), `WEB_ORIGIN=http://localhost:3000`

3. **Instalar e gerar Prisma**
   ```bash
   pnpm install
   pnpm --filter api exec prisma generate
   pnpm --filter api exec prisma db push
   ```

4. **Build do shared**
   ```bash
   pnpm --filter @adpageops/shared build
   ```

5. **Subir API, Worker e Web** (em terminais separados)
   ```bash
   pnpm --filter api dev
   pnpm --filter worker dev
   pnpm --filter web dev
   ```
   - Web: http://localhost:3000  
   - API: http://localhost:4000  
   - Health: http://localhost:4000/health  

## Deploy (produção)

- **Migrations**: GitHub Actions aplica `supabase db push` no push para `main` (veja `docs/supabase-setup.md`).
- **Railway**: 3 services (web, api, worker). Configuração em `docs/railway-setup.md`.
- **Secrets**: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` no GitHub; no Railway: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `META_*`, `APP_BASE_URL`, `API_BASE_URL`. Veja `.env.example` e `docs/production-env.md`.

## Comandos úteis

| Comando | Descrição |
|--------|-----------|
| `pnpm dev` | Roda dev em paralelo (web, api, worker) |
| `pnpm build` | Build de todos os pacotes |
| `pnpm --filter api exec prisma studio` | Abre Prisma Studio |
| `pnpm --filter api exec prisma migrate dev` | Cria e aplica migration local |

## Modo demo

- Defina `NEXT_PUBLIC_DEMO_MODE=true` no frontend para exibir mensagem de demo quando não houver dados.
- Opcional: seed com dados fake (script em `apps/api/prisma/seed.ts` ou similar) e feature flag para usar seed no dashboard.

## Documentação

- [Milestones v2](docs/milestones-v2.md)
- [Meta – por que não senha](docs/meta-auth.md)
- [Env produção](docs/production-env.md)
- [Railway](docs/railway-setup.md)
- [Supabase](docs/supabase-setup.md)
- [GitHub Secrets](docs/github-secrets.md)
- [Arquitetura](docs/architecture.md)
- [Status operacional](docs/status-logic.md)
- [Scoring](docs/scoring.md)
- [Segurança](docs/security.md)
- [Retenção](docs/data-retention.md)
- [Meta campos](docs/meta-fields.md)
- [Rate limit](docs/rate-limit-strategy.md)
