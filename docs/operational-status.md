# Status operacional (taxonomia)

## Campos usados da Meta

- **configured_status**: ACTIVE | PAUSED | DELETED | ARCHIVED
- **effective_status**: ACTIVE | PENDING_REVIEW | DISAPPROVED | PREAPPROVED | PENDING_BILLING_INFO | etc.
- (Quando disponível) **review_feedback**, **rejection_reason** em nível de ad/insights

## Heurísticas

- Quando a Meta não expõe sinal explícito de revisão/rejeição:
  - **effective_status** em `PENDING_REVIEW`, `PENDING_BILLING_INFO`, `PENDING_SETTLEMENT` → **IN_REVIEW**
  - **effective_status** em `DISAPPROVED`, `REJECTED` → **REJECTED**
  - Sem entrega (impressions=0 e spend=0) na janela X com **configured_status** ACTIVE → **NOT_DELIVERING**
  - **effective_status** ERROR/INVALID → **ACCOUNT_ISSUE**

## Parâmetros configuráveis

- **deliveryWindowDays** (default 7): janela em dias para considerar “entrega” (impressions>0 ou spend>0).
- **minImpressionsForDelivering** (default 0).
- **minSpendForDelivering** (default 0).
- **inReviewStaleHours** (default 48): horas para considerar IN_REVIEW “estale” (heurística de alerta).

## Mapeamento

| Status Ops       | Condição |
|------------------|----------|
| PAUSED           | configured_status PAUSED/ARCHIVED/DELETED |
| ACCOUNT_ISSUE    | effective_status ERROR/INVALID (sem sinal de reject) |
| REJECTED         | hasRejectSignal ou effective_status DISAPPROVED/REJECTED |
| IN_REVIEW        | hasReviewSignal ou effective_status PENDING_* |
| DELIVERING       | impressões ou spend na janela acima dos mínimos |
| NOT_DELIVERING   | ACTIVE mas sem entrega na janela |
