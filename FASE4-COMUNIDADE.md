# PromptHub - Fase 4: Comunidade, Perfil e Descoberta

## Implementado

- página Explorar em `/explore`
- busca global por título, descrição e autor
- ordenação por:
  - mais recentes
  - mais vistos
  - mais favoritados
  - mais forkados
- filtro por categoria
- tags nos prompts
- filtro por tag
- tags populares
- perfil editável
- avatar por URL
- bio
- perfil público em `/u/username`
- estatísticas pessoais
- estatísticas públicas
- busca da barra superior funcionando
- links de autores para o perfil público
- cards exibindo tags
- forks preservam as tags do prompt original

## Banco

Não há novas tabelas nesta fase.

As tabelas `tags` e `prompt_tags` já existem.

## Arquivos novos

- apps/api/src/routes/community.ts
- apps/web/app/explore/page.tsx
- apps/web/app/u/[username]/page.tsx
- apps/web/app/community.css

## Arquivos alterados

- apps/api/src/routes/prompts.ts
- apps/api/src/server.ts
- apps/web/components/AppShell.tsx
- apps/web/components/PromptCard.tsx
- apps/web/app/dashboard/page.tsx
- apps/web/app/profile/page.tsx
- apps/web/app/new/page.tsx
- apps/web/app/prompt/[id]/edit/page.tsx
- apps/web/app/layout.tsx

## Publicação

Extraia o ZIP sobre a raiz do repositório.

Depois:

```powershell
cd D:\GitHub\prompthub

git status
git add .
git commit -m "Implementa comunidade perfil busca e tags"
git push origin main
```

Aguarde o Render ficar Live e depois o Cloudflare concluir.

## Testes

1. Dashboard mostra estatísticas.
2. Barra superior pesquisa e abre `/explore?q=...`.
3. `/explore` mostra somente prompts públicos.
4. Ordenação funciona.
5. Filtro por categoria funciona.
6. Crie um prompt com tags.
7. Edite as tags.
8. Clique em uma tag e valide o filtro.
9. Acesse Perfil e altere nome, bio e avatar.
10. Abra seu perfil público em `/u/seuusername`.
11. Perfil público mostra somente prompts públicos.
12. Prompts privados continuam invisíveis para outros usuários.
