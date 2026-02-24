# Meta Graph API – Campos coletados (AdPageOps)

## Ads

- **id**, **name**, **configured_status**, **effective_status**
- **creative** (id) — usado para buscar `object_story_spec` e extrair `page_id` / `instagram_actor_id`
- **adset_id**, **campaign_id** (implícito via adset/campaign)

## Ad Sets

- **id**, **name**, **status**, **effective_status**
- **optimization_goal**, **billing_event**

## Creatives

- **object_story_spec** — fonte de:
  - `object_story_spec.page_id`
  - `object_story_spec.instagram_actor_id`
  - (quando existir) `link_data`, etc.

## Insights (time_increment=1, level=ad)

- **impressions**, **spend**, **clicks**
- **actions** — array `[{ action_type, value }]` (conversões, leads, etc.)
- **action_values**
- **date_start** / **date_end** (janela do relatório)

## Janelas de sync

- **Inventory**: a cada 30 min (Campaigns → Ad Sets → Ads → Creatives; extração de page_id/ig_actor_id).
- **Insights**: diário + “last 2 days” para backfill.

## Idempotência

- Upserts por `(tenant_id, meta_id)` em campaigns, adsets, ads, pages.
- **insights_daily**: unique `(tenant_id, entity_level, entity_id, date)`.
