# Fase 3 - Render

O backend está em `apps/api`.

## Variáveis

- DATABASE_URL
- AUTH_SECRET, mínimo 32 caracteres
- FRONTEND_URL, URL exata do frontend Cloudflare
- NODE_ENV=production

## Deploy com render.yaml

O arquivo `render.yaml` na raiz cria o serviço `prompthub-api`.

Build:

```bash
npm install && npm run build:api
```

Start:

```bash
npm run start -w @prompthub/api
```

Health check:

`/health`

A API escuta `0.0.0.0` na porta indicada por `PORT`.
