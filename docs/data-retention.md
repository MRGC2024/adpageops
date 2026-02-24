# Retenção de dados e limpeza

## Configuração

- **DATA_RETENTION_DAYS** (env): dias de retenção para insights (ex.: 180 em produção).
- Pode ser sobrescrito por **tenant_settings** (key: data_retention_days, value_json: número).

## Job data_retention_cleanup

- Roda **diariamente** (cron).
- Apaga registros de **insights_daily** onde `date < (hoje - DATA_RETENTION_DAYS)`.
- Filtra por tenant_id; não apaga campaigns/adsets/ads/pages, apenas métricas diárias.

## Auditoria

- **audit_logs**: retenção pode ser definida por política (ex.: 1 ano); não há job de limpeza no MVP (opcional depois).
