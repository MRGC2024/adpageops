# Railway – Configuração AdPageOps

## Serviços

Crie **3 services** no mesmo projeto Railway, todos conectados ao **mesmo repositório GitHub** (monorepo).

### 1) Web (Next.js)

- **Root Directory**: `apps/web`
- **Build Command**: `pnpm install && pnpm run build` (ou `cd ../.. && pnpm install && pnpm --filter web build`)
- **Start Command**: `pnpm start` (ou `pnpm run start`)
- **Variáveis de ambiente**:
  - `NEXT_PUBLIC_API_URL` = URL do service API (ex: `https://api-xxx.up.railway.app`)
  - (opcional) `NEXT_PUBLIC_DEMO_MODE` = `true` para modo demo
- **Healthcheck**: path `/` ou não configurar
- **Domínio**: gerado pelo Railway (ex: `web-xxx.up.railway.app`) ou custom

**Nota**: No monorepo, o build precisa rodar na raiz ou com `pnpm --filter web build`. Configure o **Root Directory** como raiz do repo e use:
- Build: `pnpm install && pnpm --filter web build`
- Start: `pnpm --filter web start`

Ou defina Root Directory como `apps/web` e no Railway use “Watch Paths” ou build na raiz:
- Build Command (na raiz): `pnpm install && pnpm --filter web build`
- Start Command: `cd apps/web && pnpm start`

Recomendação: **Root Directory** = raiz do repositório; **Build Command** = `pnpm install && pnpm --filter web build`; **Start Command** = `pnpm --filter web start`.

### 2) API (NestJS)

- **Root Directory**: (raiz do repo)
- **Build Command**: `pnpm install && pnpm --filter api exec prisma generate && pnpm --filter api build`
- **Start Command**: `pnpm --filter api start`
- **Variáveis de ambiente**:
  - `DATABASE_URL` (Supabase Postgres)
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (Redis Railway)
  - `JWT_SECRET`
  - `TOKEN_ENCRYPTION_KEY`
  - `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`
  - `WEB_ORIGIN` (URL do frontend)
- **Healthcheck**: `GET /health` → 200
- **Domínio**: ex: `api-xxx.up.railway.app`

### 3) Worker (BullMQ)

- **Root Directory**: (raiz do repo)
- **Build Command**: `pnpm install && pnpm --filter api exec prisma generate && pnpm --filter worker build`
- **Start Command**: `pnpm --filter worker start`
- **Variáveis de ambiente**:
  - `DATABASE_URL` (mesmo Supabase)
  - `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
  - `TOKEN_ENCRYPTION_KEY` (igual à API)
- **Healthcheck**: não há HTTP; usar “no healthcheck” ou script que verifica processo
- **Domínio**: não necessário

## GitHub Autodeploy

1. Conecte o repositório ao projeto Railway.
2. Para cada service, em **Settings** → **Source**:
   - Conecte ao mesmo repo.
   - Branch: `main` (ou a desejada).
   - **Root Directory**: conforme acima (raiz ou `apps/web` só para web).
   - **Watch Paths** (se disponível): ex. `apps/web/**` para o service web, para não rebuildar em mudanças só na API.
3. Cada push em `main` dispara build e deploy do service cujo código mudou (se Watch Paths estiver configurado) ou de todos.

## Deploy via CLI (GitHub Actions)

Use o **Railway CLI** em um job de CI:

```yaml
- uses: railwayapp/railway-cli-action@v1
  with:
    railway_token: ${{ secrets.RAILWAY_TOKEN }}
    service: api
  env:
    RAILWAY_ENVIRONMENT: production
```

Ou `railway up` após build, apontando para o service correto. Variáveis já configuradas no dashboard Railway.
