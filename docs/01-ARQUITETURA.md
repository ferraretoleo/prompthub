# Fase 1 - Arquitetura

## Topologia

Navegador -> Cloudflare Worker / Next.js -> Render API -> Neon PostgreSQL

O frontend também funciona como BFF. O token JWT emitido pela API do Render é guardado em cookie HttpOnly no domínio do frontend. O navegador não precisa armazenar o token em localStorage.

## Componentes

- apps/web: Next.js 16, React, TypeScript, Tailwind CSS, vinext, Cloudflare Workers.
- apps/api: Node.js, Express, TypeScript, Zod, JWT e bcrypt.
- packages/database: Neon PostgreSQL + Drizzle ORM.

## Autenticação

A primeira versão usa autenticação própria segura:

- senha com bcrypt, custo 12;
- JWT HS256 com expiração de 12 horas;
- segredo apenas no backend;
- cookie HttpOnly criado pelo BFF do frontend;
- user_id sempre extraído do token no backend.

## Isolamento

Leitura de um prompt: proprietário OU visibility=PUBLIC.
Alteração e exclusão: somente proprietário.
Fork: cria um novo prompt ligado ao usuário autenticado.
Favorito: não muda a propriedade do prompt.
