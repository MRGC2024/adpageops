# AdPageOps MVP – Plano de Milestones (5–7 dias)

## Visão geral

| Milestone | Dias | Entregas |
|-----------|------|----------|
| M1 – Fundação | 1 | Monorepo, DB, auth, multi-tenant |
| M2 – Integração Meta | 1.5 | OAuth, sync inventory, insights, status |
| M3 – Dashboard & API | 1.5 | Endpoints, dashboard por página, CSV |
| M4 – Alertas & Worker | 1 | Regras, jobs, resolved_at |
| M5 – Deploy & Docs | 1 | CI/CD, Railway, Supabase, docs |
| M6 – Demo & polish | 0.5 | Seed mock, feature flag, testes |

---

## M1 – Fundação (Dia 1)

- [ ] Monorepo pnpm: `apps/web`, `apps/api`, `apps/worker`, `packages/shared`
- [ ] `docker-compose.yml`: Postgres, Redis
- [ ] Supabase: projeto criado, migrations versionadas (tenants, users, roles)
- [ ] Prisma schema com tenant_id em todas as tabelas
- [ ] API: registro/login (email+senha), JWT, middleware tenant
- [ ] Web: layout base, login/register, sidebar “Accounts”

**Critério de conclusão:** usuário registra, faz login, vê sidebar vazia.

---

## M2 – Integração Meta (Dias 2–2.5)

- [ ] Meta App criado, OAuth server-side (state/nonce), callback
- [ ] Armazenamento seguro de token (encrypted at rest)
- [ ] Endpoints: `GET /integrations/meta/connect`, `callback`, `status`
- [ ] Descobrir Ad Accounts do usuário
- [ ] POST `/ad-accounts/select` para persistir contas selecionadas
- [ ] Worker: job “inventory sync” (Campaigns → Ad Sets → Ads → Creatives)
- [ ] Extração de `page_id` / `instagram_actor_id` do creative
- [ ] Job “insights sync”: insights diários (time_increment=1), campos em `docs/meta-fields.md`
- [ ] Cliente Meta: paginação, retry/backoff, rate-limit
- [ ] Taxonomia de status operacional + função determinística + testes unitários

**Critério de conclusão:** conectar Meta (dev), selecionar ad account, rodar sync e ver ads/pages no DB.

---

## M3 – Dashboard & API (Dias 3–3.5)

- [ ] GET `/dashboard?ad_account_id=&range=7|14|30`: agregação por página
- [ ] GET `/pages/:page_id`: detalhe da página (ads, adsets, métricas)
- [ ] GET `/ads?ad_account_id=&page_id=&status=`
- [ ] Cálculo: saturation score, ranking “página recomendada”
- [ ] Web: dashboard tabela (páginas, contagem status, spend/impressions/conversions 7d/14d/30d)
- [ ] Web: drill-down página (tabs: Ads / Adsets / Trends / Alerts)
- [ ] Export CSV (endpoint + botão no frontend)

**Critério de conclusão:** dashboard mostra páginas com métricas; drill-down e CSV funcionam.

---

## M4 – Alertas & Worker (Dia 4)

- [ ] Tabela `alerts` (tenant_id, ad_account_id, rule_key, payload, resolved_at)
- [ ] Regras: >N DELIVERING, >N REJECTED em 7d, >N IN_REVIEW por Y horas, NOT_DELIVERING com orçamento X dias
- [ ] Job periódico que avalia regras e cria/resolve alertas
- [ ] GET `/alerts?ad_account_id=`
- [ ] UI: lista de alertas no dashboard e no detalhe da página

**Critério de conclusão:** regras disparam alertas; resolved_at atualizado quando condição some.

---

## M5 – Deploy & Docs (Dia 5)

- [ ] GitHub Actions: Supabase migrations (`supabase db push`) no push para main
- [ ] Railway: 3 services (web, api, worker), root dir e comandos por app
- [ ] Docs: `README.md`, `docs/railway-setup.md`, `docs/supabase-setup.md`
- [ ] Docs: `docs/meta-fields.md`, `docs/rate-limit-strategy.md`
- [ ] Variáveis de ambiente documentadas; healthcheck por service

**Critério de conclusão:** push em main aplica migrations e faz deploy no Railway.

---

## M6 – Demo & Polish (Dia 5.5–6)

- [ ] Modo demo: feature flag + seed com dados fake (ad accounts, pages, ads, insights)
- [ ] Testes: unit (status, saturation score, grouping); integration (upsert, job mock)
- [ ] (Opcional) E2E Playwright: login → conectar meta (mock) → dashboard

**Critério de conclusão:** README com comandos exatos para rodar local e deploy; demo acessível sem Meta.
