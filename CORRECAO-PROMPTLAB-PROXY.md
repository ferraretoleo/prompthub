# Correção do Prompt Lab

Diagnóstico:

- Render está Live
- API está ouvindo na porta 10000
- GET do Prompt Lab funciona
- POST `/api/runner/:id/run` não estava chegando ao Render
- o frontend escondia a causa real ao tentar executar `response.json()`

Esta correção:

1. troca `request.arrayBuffer()` por `request.text()` no proxy
2. captura exceções do proxy
3. sempre devolve JSON em falha do proxy
4. mostra o erro real no Prompt Lab
5. preserva autenticação Bearer via cookie `prompthub_token`

## Aplicação

Substitua:

- `apps/web/app/api/proxy/[...path]/route.ts`
- `apps/web/app/prompt/[id]/run/page.tsx`

Depois:

```powershell
git add .
git commit -m "Corrige proxy do Prompt Lab e exibe erro real"
git push origin main
```

Esta correção é principalmente do frontend/Cloudflare. O Render não precisa de alteração de variável para isso.

Depois do deploy do Cloudflare:

1. Ctrl+F5
2. abra um prompt
3. Testar com IA
4. Executar com IA

Se ainda houver falha, a tela passará a mostrar a causa técnica retornada pelo proxy/API em vez da mensagem genérica.
