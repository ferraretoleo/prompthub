# PromptHub - Fase 5: Segurança e maturidade

## Implementado

- recuperação de senha
- token de redefinição com validade de 30 minutos
- token armazenado somente como SHA-256
- integração de envio com Resend
- alteração de senha do usuário logado
- exclusão da própria conta com senha + confirmação EXCLUIR
- rate limit de login
- rate limit de cadastro
- rate limit de recuperação de senha
- rate limit de mutações de prompts
- rate limit de denúncias
- auditoria de cadastro, login, falhas de login, recuperação e alteração de senha
- denúncia de prompts públicos no backend
- página 404
- página global de erro
- diálogo visual reutilizável de confirmação
- SEO/Open Graph básico para páginas públicas de prompt
- nova página Configurações

## 1. Banco Neon

Execute o arquivo:

packages/database/drizzle/0003_security_maturity.sql

Ou copie seu conteúdo para o SQL Editor do Neon.

Ele cria:

- password_reset_tokens
- prompt_reports
- audit_logs

## 2. Render

Adicione estas variáveis:

RESEND_API_KEY
PASSWORD_RESET_FROM_EMAIL

Exemplo de PASSWORD_RESET_FROM_EMAIL:

PromptHub <contato@seudominio.com>

IMPORTANTE:
o endereço precisa estar autorizado/verificado no Resend para envio público.

As variáveis atuais permanecem:

DATABASE_URL
AUTH_SECRET
FRONTEND_URL
NODE_ENV
NODE_VERSION

## 3. Publicação

Extraia o ZIP por cima da raiz do projeto.

Depois:

```powershell
cd D:\GitHub\prompthub

git status
git add .
git commit -m "Implementa seguranca recuperacao de senha e auditoria"
git push origin main
```

## 4. Testes

### Rate limit
Faça várias tentativas incorretas de login.
Após o limite, a API retorna HTTP 429.

### Recuperação de senha

Abra:

/forgot-password

Informe um e-mail existente.

O usuário recebe:

/reset-password?token=...

O token expira em 30 minutos e só pode ser utilizado uma vez.

### Alteração de senha

Abra:

/settings

Informe:
- senha atual
- nova senha
- confirmação

### Exclusão da conta

Em Configurações:

- informe a senha
- digite EXCLUIR

A exclusão remove o usuário e os dados dependentes através das FKs ON DELETE CASCADE.

### Auditoria

No Neon:

```sql
SELECT
  action,
  entity_type,
  entity_id,
  ip_address,
  created_at
FROM audit_logs
ORDER BY created_at DESC;
```

### Denúncias

A API está disponível em:

POST /api/reports

Body:

```json
{
  "promptId": "UUID",
  "reason": "SPAM",
  "description": "Descrição opcional"
}
```

Motivos:
- SPAM
- INAPPROPRIATE
- MISLEADING
- COPYRIGHT
- OTHER

A interface de moderação das denúncias ficará para a próxima fase administrativa.
