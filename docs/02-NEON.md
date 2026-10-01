# Fase 2 - Neon PostgreSQL

## Arquivos

- packages/database/src/schema.ts
- packages/database/drizzle/0000_initial.sql
- packages/database/src/seed.ts
- packages/database/drizzle.config.ts

## Criação

1. Crie um projeto no Neon.
2. Copie a connection string com SSL.
3. Defina DATABASE_URL no arquivo .env na raiz.
4. Execute a migration.

```bash
npm install
npm run db:migrate
npm run db:seed
```

Também é possível executar o arquivo `packages/database/drizzle/0000_initial.sql` pelo SQL Editor do Neon na primeira instalação. Depois disso, mantenha todas as mudanças estruturais via migrations.

## Modelo principal

users 1:N prompts
users 1:N prompt_versions
prompts 1:N prompt_versions
prompts N:N tags por prompt_tags
users N:N prompts por favorites
prompts 1:N prompt_views
prompts pode referenciar outro prompt por forked_from_prompt_id
