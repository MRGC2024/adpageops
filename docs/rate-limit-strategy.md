# Estratégia de rate limit (Meta Graph API)

- **Retry/backoff**: até 3 tentativas com backoff exponencial (1s, 2s, 4s).
- **Rate limit (códigos 4, 17)**: aguardar `rateLimitRetryAfterMs` (default 60s) e reenviar.
- **Paginação**: uso de `paging.next` (URL completa) para buscar todas as páginas sem estourar limite por request.
- **Inventário**: sync em lotes por ad account; evitar bursts (concurrency 2 no worker).
- **Insights**: time_increment=1 por ad; considerar batch por ad account e pequenas pausas entre requests em cenários de muitos ads.
