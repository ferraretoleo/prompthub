# Fase 4 - Cloudflare Workers

O frontend está em `apps/web`.

## Arquivos principais

- vite.config.ts
- wrangler.jsonc
- app/
- public/manifest.webmanifest
- public/icons/

## Primeiro deploy

Entre em `apps/web` e valide a compatibilidade do projeto:

```bash
npx vinext check
```

Depois:

```bash
npm run build:vinext
npm run deploy
```

No `wrangler.jsonc`, troque BACKEND_URL pela URL real do serviço Render.

## PWA

Já existem ícones 192x192, 512x512 e Apple Touch Icon. O `manifest.webmanifest` usa `display: standalone` e inicia em `/dashboard`.
