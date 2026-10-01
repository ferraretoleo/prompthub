# PromptHub com cadastro público

O cadastro passa a ser aberto a qualquer pessoa.

## Aplicar arquivos

Extraia este ZIP sobre a raiz do repositório.

## Excluir arquivos antigos

```powershell
Remove-Item apps/api/src/routes/admin.ts
Remove-Item apps/api/src/middleware/master.ts
Remove-Item apps/web/app/admin/users/page.tsx
```

## Banco Neon

Depois de atualizar os arquivos, execute:

```sql
DROP INDEX IF EXISTS "users_single_master_uq";
DROP INDEX IF EXISTS "users_role_idx";

ALTER TABLE "users"
DROP CONSTRAINT IF EXISTS "users_role_check";

ALTER TABLE "users"
DROP COLUMN IF EXISTS "role";
```

A coluna `is_active` permanece para permitir futuramente suspensão/moderação de conta.

## Publicar

```powershell
git status
git add .
git commit -m "Abre cadastro publico no PromptHub"
git push origin main
```

## Testar

Abra:

https://prompthub.ferrareto.workers.dev/register

Crie uma conta nova.

O usuário deve:
- ser autenticado automaticamente
- entrar no dashboard
- criar prompts próprios
- editar somente seus prompts
- acessar prompts públicos
- não acessar prompts privados de outros usuários
