# Arquitetura AdPageOps

## Visão geral

- **Monorepo**: apps/web (Next.js), apps/api (NestJS), apps/worker (BullMQ), packages/shared.
- **Banco**: Supabase Postgres (multi-tenant; tenant_id em todas as tabelas relevantes).
- **Fila/Cache**: Redis (Railway); BullMQ para jobs; cache do dashboard por (tenant_id, ad_account_id, range) com TTL.
- **Deploy**: Railway (3 services: web, api, worker); migrations via GitHub Actions + Supabase CLI.

## Fluxos principais

1. **Auth**: register/login → JWT; logout e login registrados em audit_logs.
2. **Meta**: OAuth connect → callback → token criptografado + meta_user_id + scopes; disconnect revoga no SaaS (status=revoked).
3. **Descoberta**: listar ad accounts do Meta; usuário seleciona; POST /ad-accounts/select; audit_log.
4. **Sync**: worker sync_inventory (campaigns → adsets → ads → creatives; page_id/ig_actor_id; UNKNOWN_IDENTITY quando não resolvido); sync_insights (time_increment=1, 30d); recompute_scores e alertas; data_retention_cleanup.
5. **Dashboard**: GET /dashboard (cache Redis); agregações por página (status operacional, spend/impressions/actions 7/14/30, saturation score, ranking).
6. **Alertas**: regras (N delivering, rejeições 7d, in_review Xh, not_delivering Xd); persistir; POST /alerts/:id/resolve; audit_log.

## Decisões

- **Read-only**: não editar/pausar/criar campanhas no Meta.
- **Token**: nunca logado; criptografado em repouso (ENCRYPTION_KEY).
- **Paginação**: Meta client com next/after; GET /ads com page/pageSize.
- **Status operacional**: classifyOperationalStatus com janela e heurísticas (docs/status-logic.md).
- **Score**: fórmula configurável em tenant_settings (docs/scoring.md).
