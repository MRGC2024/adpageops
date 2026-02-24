# Variáveis de ambiente – Produção

## O que é cada variável

| Variável | Descrição |
|----------|-----------|
| **DATABASE_URL** | URL de conexão PostgreSQL (Supabase). Formato: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` |
| **REDIS_URL** | URL do Redis. Formato: `redis://default:[PASSWORD]@[HOST]:[PORT]` |
| **JWT_SECRET** | Chave secreta para assinar JWTs. Deve ser longa e aleatória (ex.: 64 caracteres). |
| **ENCRYPTION_KEY** | Chave para criptografar o access_token do Meta (32 bytes / 32 caracteres ASCII). Não altere após uso ou tokens ficam inacessíveis. |
| **META_APP_ID** | ID do app no Meta for Developers. |
| **META_APP_SECRET** | Secret do app no Meta. |
| **META_REDIRECT_URI** | URL de callback OAuth: `{API_BASE_URL}/integrations/meta/callback`. Deve estar cadastrada no Meta em “Valid OAuth Redirect URIs”. |
| **META_API_VERSION** | Versão da Graph API (ex.: `v21.0`). |
| **APP_BASE_URL** | URL do frontend (ex.: `https://web-xxx.up.railway.app`). |
| **API_BASE_URL** | URL da API (ex.: `https://api-xxx.up.railway.app`). |
| **DEMO_MODE** | `true` para injetar dados fake e ignorar Meta; `false` em produção. |
| **DATA_RETENTION_DAYS** | Dias de retenção de insights (ex.: 180). Jobs apagam dados mais antigos. |
| **DASHBOARD_CACHE_TTL_SECONDS** | TTL do cache do dashboard no Redis (ex.: 300). |

---

## Onde pegar (caminho exato no painel)

### Supabase – DATABASE_URL

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard) e abra o projeto.
2. **Settings** → **Database**.
3. Em **Connection string**, escolha **URI**.
4. Copie a URL e substitua `[YOUR-PASSWORD]` pela senha do banco (a mesma definida na criação do projeto ou em **Database** → **Reset database password**).

Caminho: **Settings → Database → Connection string (URI)**.

### Railway – REDIS_URL

1. No projeto Railway, crie um serviço **Redis** (ou use um Redis existente).
2. Abra o serviço Redis.
3. Em **Variables** ou **Connect**, copie a variável **REDIS_URL** (ou monte: `redis://default:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}`).

Caminho: **Projeto → Serviço Redis → Variables / Connect**.

### Meta Developers – META_APP_ID e META_APP_SECRET

1. Acesse [Meta for Developers](https://developers.facebook.com/) → **My Apps**.
2. Selecione o app (ou crie um).
3. **Settings** → **Basic**.
4. **App ID** = META_APP_ID.
5. **App Secret** (clique em “Show”) = META_APP_SECRET.

Caminho: **My Apps → [App] → Settings → Basic**.

### META_REDIRECT_URI – onde cadastrar no Meta

1. No mesmo app: **Facebook Login** → **Settings** (ou **Use cases** → **Customize** → **Settings**).
2. Em **Valid OAuth Redirect URIs**, adicione: `https://api-xxx.up.railway.app/integrations/meta/callback` (use o **API_BASE_URL** real + `/integrations/meta/callback`).

Caminho: **My Apps → [App] → Facebook Login → Settings → Valid OAuth Redirect URIs**.

### JWT_SECRET e ENCRYPTION_KEY – como gerar valores fortes

- **Sem comandos locais**: use o **Setup Wizard** do próprio SaaS em `/admin/setup`. Lá há um gerador que gera strings aleatórias; copie e cole nas variáveis no Railway (ou no .env em dev).
- **Recomendações**: JWT_SECRET com pelo menos 32 caracteres aleatórios; ENCRYPTION_KEY exatamente 32 caracteres (para AES-256). Não altere ENCRYPTION_KEY depois de ter tokens salvos, ou não será possível descriptografá-los.

### APP_BASE_URL e API_BASE_URL

- São os domínios públicos dos serviços no **Railway** (web e api).
- Após criar os serviços e gerar domínios: **Serviço web** → **Settings** → **Domains** → copie a URL (ex.: `https://web-xxx.up.railway.app`) = APP_BASE_URL.
- **Serviço api** → **Settings** → **Domains** → copie = API_BASE_URL.

Caminho: **Railway → [Serviço] → Settings → Domains**.

---

## Qual serviço usa o quê

| Variável | Web | API | Worker |
|----------|-----|-----|--------|
| DATABASE_URL | — | ✓ | ✓ |
| REDIS_URL | — | ✓ | ✓ |
| JWT_SECRET | — | ✓ | — |
| ENCRYPTION_KEY | — | ✓ | ✓ |
| META_APP_ID | — | ✓ | — |
| META_APP_SECRET | — | ✓ | — |
| META_REDIRECT_URI | — | ✓ | — |
| META_API_VERSION | — | ✓ | ✓ |
| APP_BASE_URL | ✓ (NEXT_PUBLIC_*) | ✓ (CORS) | — |
| API_BASE_URL | ✓ (NEXT_PUBLIC_*) | — | — |
| DEMO_MODE | ✓ (NEXT_PUBLIC_DEMO_MODE) | ✓ (opcional) | — |
| DATA_RETENTION_DAYS | — | ✓ | ✓ |
| DASHBOARD_CACHE_TTL_SECONDS | — | ✓ | — |

No **Web** (Next.js), as URLs e DEMO_MODE precisam ser expostas como **NEXT_PUBLIC_APP_BASE_URL**, **NEXT_PUBLIC_API_BASE_URL** e **NEXT_PUBLIC_DEMO_MODE** para o browser.
