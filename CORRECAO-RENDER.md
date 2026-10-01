# Correção do erro de inicialização no Render

O serviço estava encerrando antes de abrir a porta porque as variáveis opcionais:

- RESEND_API_KEY
- PASSWORD_RESET_FROM_EMAIL

existiam no Render com valor vazio.

O Zod interpretava `""` como uma string inválida em vez de variável ausente.

Além disso, `PASSWORD_RESET_FROM_EMAIL` estava validado como e-mail puro, embora o Resend aceite remetentes como:

`PromptHub <contato@seudominio.com>`

## Aplicação

Substitua:

`apps/api/src/lib/env.ts`

pelo arquivo deste pacote.

Depois:

```powershell
git add apps/api/src/lib/env.ts
git commit -m "Corrige variaveis opcionais do Resend no Render"
git push origin main
```

O Render fará novo deploy automaticamente.

## Variáveis no Render

Se ainda não configurou o Resend, pode deixar as duas variáveis removidas do Render.

Quando configurar:

```text
RESEND_API_KEY=re_xxxxxxxxx
PASSWORD_RESET_FROM_EMAIL=PromptHub <contato@seudominio.com>
```

O endereço usado no remetente precisa estar autorizado no Resend.
