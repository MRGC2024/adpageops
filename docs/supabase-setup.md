# Supabase – Configuração AdPageOps

## Projeto

1. Crie um projeto em [Supabase](https://supabase.com).
2. Anote **Project Ref** e a **Database password** (definida na criação).

## Migrations via GitHub Actions

As migrations ficam em `supabase/migrations/`. Para aplicar automaticamente no push para `main`:

1. **Supabase Access Token**: em [Account → Access Tokens](https://supabase.com/dashboard/account/tokens), crie um token.
2. **Secrets no GitHub**: em Settings → Secrets and variables → Actions, adicione:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_REF` (Project Ref)
   - `SUPABASE_DB_PASSWORD` (senha do DB)

O workflow `.github/workflows/supabase-migrations.yml` usa:

- `supabase link --project-ref $SUPABASE_PROJECT_REF`
- `supabase db push` (ou `supabase migration up`) com a conexão via URL construída com `SUPABASE_DB_PASSWORD`.

## Rodar local

1. **Docker (Postgres)**:
   - `docker-compose up -d` (sobe Postgres e Redis do monorepo).
   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/adpageops`

2. **Supabase CLI (opcional)**:
   - `supabase login`
   - `supabase link --project-ref <PROJECT_REF>`
   - `supabase db push` para aplicar migrations no projeto remoto.
   - Para desenvolvimento local com Supabase local: `supabase start` e use a URL gerada.

3. **Prisma**:
   - Na raiz: `pnpm --filter api exec prisma generate`
   - Aplicar schema no DB local: `pnpm --filter api exec prisma db push`
   - Migrations versionadas no Supabase: use `supabase db push`; em dev local pode usar só `prisma db push` contra o Postgres do docker-compose.

## Edge Functions (opcional)

Se usar Edge Functions no futuro:

- Deploy: `supabase functions deploy <name>`
- No CI: adicione um job que rode `supabase functions deploy` com os secrets necessários.

Para o MVP, toda a lógica está em **api** e **worker**; Edge Functions só se fizer sentido para endpoints muito leves ou webhooks.
