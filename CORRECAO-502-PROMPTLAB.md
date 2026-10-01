# Correção definitiva do 502 do Prompt Lab

O fluxo anterior mantinha esta conexão aberta:

Cloudflare -> Render -> OpenAI -> Render -> Cloudflare

Se a chamada da IA demorasse, o proxy podia retornar 502 antes da resposta.

Agora o fluxo é assíncrono:

1. Cloudflare chama o Render.
2. Render cria `prompt_runs` com status `PENDING`.
3. Render responde imediatamente HTTP 202.
4. A chamada à OpenAI ocorre no backend.
5. O frontend consulta o status a cada 1,5 segundo.
6. Quando termina, o status vira `SUCCESS` ou `ERROR`.

## Neon

Execute:

```text
packages/database/drizzle/0006_prompt_runs_pending.sql
```

## Arquivos alterados

- apps/api/src/routes/runner.ts
- apps/web/app/prompt/[id]/run/page.tsx
- apps/web/app/runner.css

## Publicação

```powershell
git add .
git commit -m "Corrige Prompt Lab com execucao assincrona"
git push origin main
```

Depois aguarde Render e Cloudflare ficarem atualizados.

## Diagnóstico

O backend agora grava logs:

```text
PROMPT_RUN_START
PROMPT_RUN_SUCCESS
PROMPT_RUN_ERROR
```

Se a OpenAI recusar a chave, modelo, saldo ou quota, a execução ficará `ERROR` e o erro aparecerá na própria tela.
