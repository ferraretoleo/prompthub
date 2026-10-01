# PromptHub

Plataforma para armazenar, versionar e compartilhar prompts de Inteligência Artificial, com isolamento por usuário e publicação opcional de conteúdo público.

## Arquitetura

- Cloudflare Workers: frontend Next.js e camada BFF.
- Render: API Node.js/TypeScript.
- Neon: PostgreSQL.
- Drizzle ORM: schema e migrations.

## Estrutura

```text
apps/
  api/        Render
  web/        Cloudflare Workers
packages/
  database/   Neon + Drizzle
docs/         documentação faseada
render.yaml
```

## Fase 1

Leia `docs/01-ARQUITETURA.md`.

## Fase 2, Neon

Leia `docs/02-NEON.md`.

## Fase 3, Render

Leia `docs/03-RENDER.md`.

## Fase 4, Cloudflare

Leia `docs/04-CLOUDFLARE.md`.

## Instalação local

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev:api
```

Em outro terminal:

```bash
npm run dev:web
```

Frontend: http://localhost:3000
API: http://localhost:10000

## Segurança

- senha nunca é salva em texto puro;
- JWT assinado no backend;
- token fica em cookie HttpOnly no frontend;
- API ignora qualquer user_id vindo do cliente;
- propriedade é validada no backend;
- prompts privados só aparecem para o proprietário;
- edição e exclusão só são permitidas ao proprietário;
- queries passam pelo Drizzle;
- payloads são validados com Zod;
- soft delete em prompts.

## PWA

Os ícones ficam em `apps/web/public/icons` e o manifesto em `apps/web/public/manifest.webmanifest`.
