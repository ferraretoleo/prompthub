# PromptHub - Fase 9: Administração

A Fase 8 já está aplicada no repositório atual. Esta fase parte dela.

## Recursos

- área `/admin`
- acesso somente para `ADMIN`
- cards com:
  - total de usuários
  - usuários ativos
  - prompts públicos
  - prompts privados
  - denúncias abertas/em análise
- pesquisa de usuários
- alteração de perfil:
  - USER
  - MODERATOR
  - ADMIN
- ativar/desativar usuários
- proteção contra o ADMIN desativar a própria conta
- proteção contra o ADMIN remover o próprio perfil administrativo
- consulta dos 100 registros mais recentes de auditoria
- registro de toda alteração administrativa em `audit_logs`
- item `Administração` no menu apenas para ADMIN

## Banco

Não há migration nova nesta fase.

Ela usa as estruturas já existentes:

- users.role
- users.is_active
- audit_logs
- prompt_reports
- prompts

## Arquivos

Copie/substitua:

```text
apps/api/src/routes/admin.ts
apps/api/src/server.ts
apps/web/components/AppShell.tsx
apps/web/app/admin/page.tsx
apps/web/app/admin.css
apps/web/app/layout.tsx
```

## Publicação

```powershell
git add .
git commit -m "Implementa painel administrativo do PromptHub"
git push origin main
```

## Teste

1. Entre com uma conta `ADMIN`.
2. Atualize a página.
3. O menu `Administração` deve aparecer.
4. Abra `/admin`.
5. Confira os indicadores.
6. Pesquise um usuário.
7. Altere USER para MODERATOR.
8. Desative e reative uma conta de teste.
9. Abra a aba `Auditoria`.
10. Confirme os registros `ADMIN_UPDATE_USER`.

## Segurança

O frontend esconder o menu não é a proteção principal.

Todas as rotas `/api/admin/*` consultam novamente no banco se:

```text
role = ADMIN
is_active = true
```

Um usuário comum que tentar chamar as rotas diretamente recebe HTTP 403.
