# PromptHub - Fase 8: Moderação e Administração

Esta fase remove completamente o recurso de execução/teste com IA e adiciona moderação da comunidade.

## O que sai

- botão `Testar com IA`
- Prompt Lab
- execução via OpenAI
- configuração de API Key
- chave própria de usuário
- `prompt_runs`
- `user_ai_settings`
- rotas `/api/runner`
- rotas `/api/ai-settings`

As migrations antigas 0004, 0005 e 0006 podem permanecer no histórico do Git. A migration 0007 remove as tabelas correspondentes da base atual.

## O que entra

- denúncia de prompt público
- painel `/moderation`
- perfis:
  - USER
  - MODERATOR
  - ADMIN
- status:
  - OPEN
  - REVIEWING
  - RESOLVED
  - DISMISSED
- despublicação de prompt denunciado
- auditoria das ações de moderação
- menu `Moderação` visível apenas para MODERATOR/ADMIN

## 1. Neon

Execute:

```text
packages/database/drizzle/0007_remove_ai_add_moderation.sql
```

Depois defina seu usuário administrativo.

Use seu próprio e-mail no comando:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'SEU_EMAIL';
```

Confirme:

```sql
SELECT
  username,
  email,
  role
FROM users
ORDER BY created_at;
```

## 2. Remover arquivos da IA

Execute na raiz do projeto:

```powershell
git rm apps/api/src/routes/runner.ts
git rm apps/api/src/routes/aiSettings.ts
git rm apps/api/src/lib/openai.ts
git rm apps/api/src/lib/secretCrypto.ts
git rm "apps/web/app/prompt/[id]/run/page.tsx"
git rm apps/web/app/runner.css
```

## 3. Render

As variáveis abaixo deixam de ser necessárias e podem ser removidas:

```text
OPENAI_API_KEY
OPENAI_MODEL
AI_KEYS_ENCRYPTION_SECRET
```

Não remova:

```text
DATABASE_URL
AUTH_SECRET
FRONTEND_URL
RESEND_API_KEY
PASSWORD_RESET_FROM_EMAIL
NODE_ENV
NODE_VERSION
```

## 4. Publicação

Depois de copiar os arquivos deste pacote:

```powershell
git status
git add .
git commit -m "Remove Prompt Lab e implementa moderacao"
git push origin main
```

## 5. Teste

1. Entre com o usuário definido como ADMIN.
2. Atualize a página.
3. O item `Moderação` deve aparecer no menu.
4. Entre com outro usuário.
5. Abra um prompt público que não seja seu.
6. Clique em `Denunciar`.
7. Envie uma denúncia.
8. Volte ao usuário ADMIN.
9. Abra `/moderation`.
10. A denúncia deve aparecer.
11. Teste `Em análise`, `Resolver`, `Descartar` e `Despublicar`.

`Despublicar` altera o prompt de PUBLIC para PRIVATE. O conteúdo não é excluído.
