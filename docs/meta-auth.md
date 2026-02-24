# Autenticação Meta – Por que não usamos login/senha do Facebook

## Por que não dá (e não devemos) coletar senha do Meta

- **Segurança**: Guardar a senha do Facebook/Meta no nosso SaaS seria um risco enorme. Se nosso banco vazasse, contas de usuários no Facebook estariam comprometidas.
- **Política do Meta**: O Meta **proíbe** que aplicativos peçam ou armazenem senha do Facebook. Fazer isso viola as políticas da plataforma e pode resultar em bloqueio do app.
- **Confiabilidade**: O usuário não precisa (e não deve) confiar nossa aplicação com a senha dele; ele só autoriza **permissões** na tela oficial do Meta.

Por isso: **nunca** pedimos ou armazenamos login/senha do Facebook dentro do AdPageOps.

---

## Como funciona (OAuth)

1. No AdPageOps o usuário clica em **“Conectar Meta Ads”**.
2. Ele é **redirecionado** para uma tela do **próprio Meta** (Facebook/Instagram/Meta Business).
3. **Lá**, o usuário digita **login e senha na tela do Meta** (não na nossa). Nosso sistema nunca vê essa senha.
4. O Meta mostra quais permissões o app está pedindo (ex.: ler anúncios, contas de anúncios). O usuário aceita ou recusa.
5. Se aceitar, o Meta redireciona de volta para o AdPageOps com um **código** (ou token). Nosso backend troca esse código por um **access_token**.
6. Esse **access_token** é o que armazenamos (criptografado) e usamos para chamar a API do Meta em nome do usuário. Não é a senha; é um token de acesso temporário e revogável.

Resumo: **login/senha ficam só no Meta**. Nosso SaaS só recebe e guarda o **token de acesso** após o usuário autorizar na tela do Meta.

---

## O que o usuário vê

1. **No AdPageOps**: botão “Conectar Meta Ads”.
2. **Ao clicar**: o navegador abre (ou redireciona para) a **página de login do Meta** (facebook.com / business.facebook.com etc.).
3. **Na tela do Meta**: campo de email/telefone e senha – tudo digitado **no site do Meta**, não no nosso app.
4. Depois do login, o Meta pode pedir “Autorizar o app AdPageOps a acessar…?” com lista de permissões.
5. Após “Continuar” ou “Autorizar”, o usuário volta para o AdPageOps já conectado; nosso sistema mostra algo como “Meta Ads conectado”.

Se algo falhar (ex.: usuário cancela, token expirado), mostramos mensagem de erro e, no Setup Wizard, instruções para conferir configuração (App ID, Redirect URI, etc.) **sem** pedir senha em nenhum momento.
