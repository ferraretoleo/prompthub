# Publicação do controle de usuários

## 1. Banco Neon

Você já executou a alteração do banco e definiu seu usuário como MASTER.

A migration `0001_add_user_access_control.sql` foi incluída para manter o histórico do projeto coerente.
Ela é idempotente para as colunas, índices e constraint.

Não é necessário executar novamente se o banco já está correto.

Confirme no Neon:

```sql
SELECT id, name, username, email, role, is_active
FROM users
ORDER BY created_at;
```

Deve existir apenas um usuário com `role = 'MASTER'`.

## 2. Substituir arquivos

Copie o conteúdo deste pacote para a raiz do repositório `prompthub`.

Arquivos alterados:

- packages/database/src/schema.ts
- apps/api/src/routes/auth.ts
- apps/api/src/server.ts
- apps/web/app/login/page.tsx
- apps/web/app/register/page.tsx
- apps/web/components/AppShell.tsx

Arquivos novos:

- packages/database/drizzle/0001_add_user_access_control.sql
- apps/api/src/middleware/master.ts
- apps/api/src/routes/admin.ts
- apps/web/app/admin/users/page.tsx

## 3. Commit

```powershell
cd D:\GitHub\prompthub

git status
git add .
git commit -m "Implementa controle MASTER e administracao de usuarios"
git push origin main
```

## 4. Render

O Auto Deploy deve iniciar automaticamente.

Acompanhe o deploy do `prompthub-api`.

Depois teste:

```text
https://prompthub-api-bvgj.onrender.com/health
```

## 5. Cloudflare

O push na branch main deve disparar o build do Worker automaticamente.

Aguarde até aparecer `Success`.

Acesse:

```text
https://prompthub.ferrareto.workers.dev
```

## 6. Testes

1. Faça login com sua conta MASTER.
2. No menu deve aparecer `Usuários`.
3. Acesse `/admin/users`.
4. Crie um usuário comum.
5. Saia da conta MASTER.
6. Entre com o usuário criado.
7. O usuário comum não deve ver o menu `Usuários`.
8. Tente abrir `/admin/users` manualmente.
9. O usuário comum deve ser redirecionado para `/dashboard`.
10. Tente abrir `/register`.
11. A página deve redirecionar para `/login`.
12. Tente chamar diretamente `POST /api/auth/register`.
13. A API deve retornar HTTP 403.

## Regras

- Só existe um MASTER.
- MASTER cria usuários.
- Usuários comuns recebem role USER.
- USER não cria outros usuários.
- Usuário inativo não consegue fazer login.
- MASTER não pode desativar a própria conta pela tela administrativa.
- O cadastro público fica desativado.
