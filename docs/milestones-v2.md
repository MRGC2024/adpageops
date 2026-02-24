# AdPageOps MVP – Plano de Milestones (8–12 etapas)

## Visão geral

| # | Etapa | Entregáveis |
|---|--------|-------------|
| 1 | Fundação + Auth + Modelo | Monorepo, DB (Prisma + SQL migrations), tenants/users, auth (register/login/logout), JWT, RBAC, audit_logs (login/logout) |
| 2 | Env + Docs base | .env.example, docs/production-env.md (onde pegar cada var, por serviço), docs/security.md, docs/meta-auth.md |
| 3 | Meta OAuth + Conexão | OAuth connect/callback/status/disconnect, armazenar token criptografado (ENCRYPTION_KEY), meta_user_id, scopes, token_expires_at, audit_log (connect/disconnect) |
| 4 | Setup Wizard + Health | /admin/setup (tenant_admin), cards DB/Redis/Meta + “Testar”, gerador JWT_SECRET/ENCRYPTION_KEY na UI, GET /admin/health/db, /redis, /meta |
| 5 | Descoberta + Sync inventory | GET ad accounts, POST ad-accounts/select, worker sync_inventory (campaigns → adsets → ads → creatives), page_id/ig_actor_id + fallback UNKNOWN_IDENTITY, audit_log |
| 6 | Insights + Cache + Status | Sync insights (time_increment=1, 30d), agregações 7/14/30, classifyOperationalStatus + docs/status-logic.md, cache dashboard Redis (TTL + invalidação) |
| 7 | Dashboard + Pages + Ads | GET /dashboard, GET /pages (list + filters/sort), GET /pages/:id, GET /ads (paginação), saturation score (docs/scoring.md), tenant_settings (pesos/flags) |
| 8 | Alertas + Resolve | Regras (N delivering, rejeições 7d, in_review Xh, not_delivering Xd), persistir alerts, POST /alerts/:id/resolve, GET /alerts?status=, audit_log |
| 9 | Jobs + Retenção | sync_inventory 30min, sync_insights diário + 48h backfill, recompute_scores + alerts após sync, data_retention_cleanup (DATA_RETENTION_DAYS), DLQ/retries |
| 10 | Frontend completo | /login, /register, /onboarding (conectar Meta + selecionar contas), /dashboard, /pages/[id], /alerts, /admin/setup, /admin/settings (flags/thresholds), CSV export, skeletons, paginação |
| 11 | DEMO_MODE + Feature flags | DEMO_MODE=true injeta dados fake, enable_alerts/enable_scoring/enable_demo_mode_override em tenant_settings, UI /admin/settings |
| 12 | CI/CD + Docs finais | ci.yml (lint, typecheck, tests, build), supabase-migrations.yml, docs/railway-setup.md, docs/supabase-setup.md, docs/github-secrets.md, docs/architecture.md, docs/data-retention.md |

---

## Etapa 1 – Fundação + Auth + Modelo
- Monorepo (apps/web, api, worker, packages/shared), docker-compose (postgres, redis).
- Prisma schema: tenants, users, meta_connections, ad_accounts, pages, campaigns, adsets, ads, insights_daily, alerts, tenant_settings, audit_logs.
- Supabase migrations versionadas.
- Auth: POST /auth/register, /login, /logout; JWT; RBAC tenant_admin/tenant_user.
- audit_logs: registrar login e logout.

## Etapa 2 – Env + Docs base
- .env.example com todas as variáveis listadas.
- docs/production-env.md: significado, onde pegar (caminho exato nos painéis), qual serviço usa o quê.
- docs/security.md: JWT, criptografia, logging seguro.
- docs/meta-auth.md: por que não coletamos senha do Meta; como OAuth funciona; o que o usuário vê.

## Etapa 3 – Meta OAuth + Conexão
- GET /integrations/meta/connect, /callback, /status, POST /disconnect.
- Armazenar access_token_enc, meta_user_id, scopes_json, token_expires_at.
- Criptografia com ENCRYPTION_KEY (AES-256-GCM ou equivalente).
- audit_log: conectar/desconectar Meta.

## Etapa 4 – Setup Wizard + Health
- Rota /admin/setup (apenas tenant_admin).
- Cards: DB conectado, Redis conectado, Meta App configurado; botão “Testar” em cada.
- Mensagens de erro com “onde pegar” e “o que colar”.
- Gerador de JWT_SECRET e ENCRYPTION_KEY na UI (copiar, aviso de não alterar).
- GET /admin/health/db, /admin/health/redis, /admin/health/meta.

## Etapa 5 – Descoberta + Sync inventory
- Listar ad accounts; POST /ad-accounts/select.
- Worker: sync_inventory (campaigns, adsets, ads, creatives).
- Extrair page_id/instagram_actor_id do creative; fallback UNKNOWN_IDENTITY (page_id NULL, audit_log).

## Etapa 6 – Insights + Cache + Status
- Sync insights (level ad/adset, time_increment=1, 30d), agregações 7/14/30.
- classifyOperationalStatus(ad, insightsWindow, now, config) com testes unitários.
- docs/status-logic.md (heurística, DELIVERY_WINDOW_DAYS, REVIEW_MAX_AGE_HOURS, NOT_DELIVERING_DAYS).
- Cache dashboard no Redis por (tenant_id, ad_account_id, range), TTL; invalidação ao fim do sync.

## Etapa 7 – Dashboard + Pages + Ads
- GET /dashboard?ad_account_id=&range=; GET /pages (q, sort); GET /pages/:id; GET /ads (page, pageSize).
- Saturation score (fórmula em docs/scoring.md, pesos em tenant_settings).
- “Página recomendada”: ordenação por score e tie-breakers.

## Etapa 8 – Alertas + Resolve
- Regras configuráveis (N, X dias/horas); persistir em alerts (type, severity, entity_type, entity_id, payload_json, resolved_at).
- GET /alerts?ad_account_id=&status=open|resolved; POST /alerts/:id/resolve.
- audit_log ao resolver.

## Etapa 9 – Jobs + Retenção
- sync_inventory a cada 30 min; sync_insights diário + backfill 48h.
- recompute_scores e avaliação de alertas após sync.
- data_retention_cleanup diário (insights_daily > DATA_RETENTION_DAYS).
- Retries, backoff, DLQ; correlation id nos jobs.

## Etapa 10 – Frontend completo
- Páginas: login, register, onboarding, dashboard, pages/[id], alerts, admin/setup, admin/settings.
- Tabelas com sorting, filtros, search; badges status; CSV export; empty states; skeleton loading; paginação em listas grandes.

## Etapa 11 – DEMO_MODE + Feature flags
- DEMO_MODE=true: dados fake, sem Meta; UI completa.
- tenant_settings: enable_alerts, enable_scoring, enable_demo_mode_override; thresholds e pesos; UI em /admin/settings.

## Etapa 12 – CI/CD + Docs finais
- .github/workflows/ci.yml e supabase-migrations.yml.
- docs/railway-setup.md, supabase-setup.md, github-secrets.md, architecture.md, data-retention.md, meta-fields.md, rate-limit-strategy.md.
