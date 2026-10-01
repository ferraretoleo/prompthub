# PromptHub - Fase do ciclo completo de prompts

## Arquivos alterados

- apps/api/src/routes/prompts.ts
- apps/web/app/dashboard/page.tsx
- apps/web/app/new/page.tsx
- apps/web/app/layout.tsx
- apps/web/components/PromptCard.tsx
- apps/web/components/PublicPrompt.tsx

## Arquivos novos

- apps/web/app/prompt/[id]/page.tsx
- apps/web/app/prompt/[id]/edit/page.tsx
- apps/web/components/PromptDetail.tsx
- apps/web/components/VersionHistory.tsx
- apps/web/app/prompt-ui.css

## O que foi implementado

- Abrir prompt dentro do mesmo layout da dashboard
- Copiar prompt
- Editar prompt próprio
- Excluir prompt próprio
- Histórico de versões
- Abrir uma versão anterior para consulta
- Voltar para versão atual
- Favoritar prompt público de outro usuário
- Remover favorito
- Fork de prompt público
- Fork abre diretamente na edição da cópia
- Filtro Favoritos funcionando
- Página pública no mesmo padrão visual da dashboard
- Novo Prompt atualizado para o padrão GitHub
- Redirecionamento para a página do prompt após criar

## Publicação

Extraia o ZIP sobre a raiz do repositório.

Depois:

```powershell
cd D:\GitHub\prompthub

git status
git add .
git commit -m "Implementa ciclo completo de prompts"
git push origin main
```

Aguarde:

1. Render atualizar a API.
2. Cloudflare atualizar o frontend.

## Teste com seu usuário

### Meus Prompts

Acesse:

```text
/dashboard?scope=mine
```

Cada prompt deve apresentar:

- Abrir prompt
- Editar

### Abrir prompt

A rota será:

```text
/prompt/UUID-DO-PROMPT
```

Ela deve manter:

- barra superior
- sidebar
- padrão visual GitHub
- conteúdo amplo

### Editar

A rota será:

```text
/prompt/UUID-DO-PROMPT/edit
```

Altere o conteúdo e informe uma descrição de alteração.

Uma mudança de conteúdo aumenta `current_version` e cria registro em `prompt_versions`.

### Favoritos

Favorite um prompt público de outro usuário.

Depois acesse:

```text
/dashboard?scope=favorites
```

O prompt deve aparecer.

### Fork

Abra um prompt público de outro usuário e clique em Fork.

Será criada uma cópia:

- pertencente ao usuário atual
- PRIVATE
- independente do original
- versão 1
- `forked_from_prompt_id` apontando para a origem

### Exclusão

Somente o proprietário verá Excluir na tela interna.

A exclusão permanece soft delete usando `deleted_at`.
