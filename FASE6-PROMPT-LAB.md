# PromptHub - Fase 6: Prompt Lab com IA

## Implementado

- botão `Testar com IA` na página de cada prompt
- nova tela `/prompt/[id]/run`
- detecção automática de variáveis `{{variavel}}`
- formulário dinâmico para preencher variáveis
- preview do prompt final antes da execução
- integração backend com OpenAI Responses API
- chave da OpenAI nunca enviada ao navegador
- histórico das últimas 20 execuções por usuário e prompt
- registro do modelo usado
- duração da execução
- tokens de entrada e saída quando retornados pela API
- limite de 30 execuções por hora por IP
- limite de 50 execuções por dia por usuário
- limite de 50.000 caracteres por prompt renderizado
- auditoria `RUN_PROMPT`
- forks continuam independentes e podem ser executados normalmente

## Banco Neon

Execute:

`packages/database/drizzle/0004_prompt_runs.sql`

Cria a tabela:

`prompt_runs`

## Render

Adicione:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
```

`OPENAI_MODEL` é opcional. Se não for definido, o backend usa `gpt-5.6-luna`.

A chave deve existir SOMENTE no Render. Não coloque no Cloudflare nem no GitHub.

## Variáveis de prompt

Exemplo de conteúdo:

```text
Você é um DBA especialista em {{banco}}.

Analise esta consulta:

{{query}}

O ambiente possui aproximadamente {{volume_registros}} registros.
```

O Prompt Lab detectará automaticamente:

- banco
- query
- volume_registros

## Publicação

```powershell
cd D:\GitHub\prompthub

git status
git add .
git commit -m "Implementa Prompt Lab com execucao de IA"
git push origin main
```

## Testes

1. Rode a migration no Neon.
2. Configure OPENAI_API_KEY no Render.
3. Aguarde Render ficar Live.
4. Aguarde Cloudflare concluir.
5. Abra um prompt.
6. Clique em `Testar com IA`.
7. Preencha as variáveis.
8. Confira o prompt final.
9. Clique em `Executar com IA`.
10. Verifique a resposta e o histórico.

## Segurança e custos

Nesta fase a API key pertence à plataforma PromptHub.

Isso significa que as execuções feitas pelos usuários consomem o saldo da conta OpenAI configurada no Render.

Por isso já foram colocados limites de uso.

Uma fase futura pode implementar:
- planos
- créditos por usuário
- cobrança
- chave própria do usuário
- diferentes provedores de IA
