# GitHub Secrets – Onde colar e nomes exatos

## Onde configurar

**Repositório GitHub** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

## Secrets para Supabase migrations

| Nome exato | Descrição | Exemplo de valor |
|------------|-----------|------------------|
| **SUPABASE_ACCESS_TOKEN** | Token de acesso do Supabase (Dashboard → Account → Access Tokens) | `sbp_xxx...` |
| **SUPABASE_PROJECT_REF** | Project Reference ID (Dashboard → Project Settings → General) | `abcdefghijklmnop` |
| **SUPABASE_DB_PASSWORD** | Senha do banco (a mesma usada na conexão; Settings → Database) | senha definida na criação |

## Preenchimento

1. **SUPABASE_ACCESS_TOKEN**: em [Supabase Account → Access Tokens](https://supabase.com/dashboard/account/tokens), gere um token e cole.
2. **SUPABASE_PROJECT_REF**: em **Project Settings → General**, copie o **Reference ID**.
3. **SUPABASE_DB_PASSWORD**: use a senha do banco que você definiu (ou **Database → Reset database password**).

O workflow **supabase-migrations.yml** usa esses três secrets para rodar `supabase link` e `supabase db push` no push para `main` quando `supabase/migrations/**` mudar.
