# Publicação do PromptHub no Render

## 1. Atualize o GitHub

Substitua no repositório o arquivo:

`apps/api/src/routes/prompts.ts`

pelo arquivo corrigido deste pacote.

Depois faça commit e push para a branch `main`.

## 2. Render

O serviço já deve estar ligado ao repositório `ferraretoleo/prompthub`.

Configuração esperada:

- Build Command: `npm install --include=dev && npm run build:api`
- Start Command: `npm run start -w @prompthub/api`
- Health Check Path: `/health`
- Node: `22`

## 3. Variáveis de ambiente

Configure no Render:

- `DATABASE_URL`: connection string do Neon
- `AUTH_SECRET`: segredo forte
- `FRONTEND_URL`: enquanto o Cloudflare não estiver publicado, pode usar `https://example.com`
- `NODE_ENV`: `production`
- `NODE_VERSION`: `22`

## 4. Deploy

Como o Auto Deploy está habilitado, o push na `main` inicia um deploy automaticamente.

Se não iniciar, use Manual Deploy > Deploy latest commit.

## 5. Teste

Após o deploy ficar Live, abra:

`https://prompthub-api-bvgj.onrender.com/health`

A API deve responder com status de saúde.
