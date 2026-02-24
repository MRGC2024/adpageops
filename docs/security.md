# Segurança AdPageOps

## JWT

- Assinatura com **JWT_SECRET** (longo e aleatório).
- Payload: sub (user id), email, tenantId, role.
- Expiração: 7d (configurável); em produção considerar expiração menor e refresh token.

## Senhas

- Hash com **bcrypt** (cost 12); nunca armazenar senha em texto.
- Nunca logar senhas ou tokens.

## Criptografia de token Meta

- **ENCRYPTION_KEY**: 32 bytes (32 caracteres ASCII) para AES-256-GCM ou equivalente (libsodium/tweetnacl secretbox).
- Token do Meta armazenado apenas criptografado (access_token_enc).
- Nunca logar access_token; nunca expor em resposta da API.

## Logging seguro

- Logs em JSON; correlation id para rastreio.
- Nunca incluir: tokens, senhas, ENCRYPTION_KEY, JWT_SECRET, access_token, refresh_token.
- Em falhas de auth/Meta, logar apenas ação e id (ex.: “meta_callback_failed”, tenant_id).

## Isolamento

- Todas as queries filtradas por **tenant_id**; usuário só acessa dados do próprio tenant.
- RBAC: tenant_admin (setup, settings, sync) e tenant_user (leitura, alertas).

## Rate limit

- Endpoints de auth (login/register): rate limit básico para mitigar brute-force (implementar por IP ou por tenant).
