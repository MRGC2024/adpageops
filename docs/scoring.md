# Saturation score e página recomendada

## Fórmula do score (configurável)

Score por página (maior = mais “saturada”):

```
score = w1 * delivering + w2 * in_review + w3 * rejected_7d + w4 * not_delivering
```

- **delivering**: quantidade de ads em estado DELIVERING na página.
- **in_review**: quantidade em IN_REVIEW.
- **rejected_7d**: quantidade REJECTED nos últimos 7 dias.
- **not_delivering**: quantidade NOT_DELIVERING.

Pesos (w1, w2, w3, w4) vêm de **tenant_settings** (key: score_weights, value_json: { w1, w2, w3, w4 }). Defaults sugeridos: w1=10, w2=5, w3=8, w4=3.

## Página recomendada

- Ordenar páginas por **menor score** (menos saturada primeiro).
- Tie-breaker: menor rejeição recente (rejected_7d); depois menor spend 7d.

## Onde é usado

- Dashboard: coluna “saturation score” e ranking “página recomendada”.
- Config editável em /admin/settings (tenant_admin).
