# Lógica de status operacional

## Função

`classifyOperationalStatus(ad, insightsWindow, now, config)` retorna um dos:

- **DELIVERING**: spend > 0 OU impressions > 0 nos últimos X dias (config: DELIVERY_WINDOW_DAYS, default 2).
- **NOT_DELIVERING**: efetivo “ativo/aprovado” mas spend = 0 e impressions = 0 nos últimos X dias.
- **PAUSED**: configured_status pausado.
- **IN_REVIEW**: quando houver sinal explícito da API; quando não houver, heurística por effective_status (PENDING_REVIEW, etc.) + ausência de entrega + idade do anúncio (REVIEW_MAX_AGE_HOURS).
- **REJECTED**: quando houver sinal explícito; quando não houver, heurística por effective_status (DISAPPROVED, etc.).
- **ACCOUNT_ISSUE**: falhas por permissão/conta/limitação.

## Flags configuráveis (config / tenant_settings)

| Flag | Descrição | Default |
|------|-----------|---------|
| DELIVERY_WINDOW_DAYS | Janela em dias para considerar “entrega” | 2 |
| REVIEW_MAX_AGE_HOURS | Idade máxima em horas para considerar IN_REVIEW “stale” (heurística) | 48 |
| NOT_DELIVERING_DAYS | Dias sem entrega para classificar NOT_DELIVERING | 7 |

## Heurística (quando Meta não expõe review/reject)

- effective_status em PENDING_REVIEW, PENDING_BILLING_INFO → IN_REVIEW.
- effective_status em DISAPPROVED, REJECTED → REJECTED.
- Sem entrega na janela + configured_status ACTIVE → NOT_DELIVERING.
- Idade do registro > REVIEW_MAX_AGE_HOURS e ainda “em revisão” pode ser tratada como alerta (in_review_stale).
