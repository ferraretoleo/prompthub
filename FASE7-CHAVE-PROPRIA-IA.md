# PromptHub - Fase 7: Chave própria de IA e controle de consumo

Este pacote já inclui a Fase 6 (Prompt Lab), porque ela ainda não aparece no repositório atual.

## Recursos

- Prompt Lab para executar prompts
- variáveis `{{campo}}`
- histórico de execuções
- modo `PLATFORM`
- modo `OWN_KEY`
- chave OpenAI própria por usuário
- AES-256-GCM para criptografar a chave no Neon
- a chave nunca é devolvida para o frontend
- remoção da chave própria
- escolha entre GPT-5.6 Luna, Terra e Sol
- modo de execução registrado em `prompt_runs`
- limites separados:
  - plataforma: 20 execuções/dia por usuário
  - chave própria: 100 execuções/dia por usuário
  - 60 execuções/hora por IP

## 1. Neon

Execute nesta ordem:

```text
packages/database/drizzle/0004_prompt_runs.sql
packages/database/drizzle/0005_user_ai_settings.sql
```

## 2. Render

Adicione obrigatoriamente para armazenar chaves de usuários:

```text
AI_KEYS_ENCRYPTION_SECRET
```

Gere uma chave aleatória longa. No PowerShell:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copie o resultado para o Render.

IMPORTANTE: depois que usuários cadastrarem chaves, não troque esse valor. A troca impede descriptografar as chaves antigas.

### Chave da plataforma

Se quiser que o PromptHub também forneça execuções usando sua conta:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.6-luna
```

Se não cadastrar `OPENAI_API_KEY`, o usuário precisará usar a própria chave.

## 3. Configurações do usuário

Em:

```text
/settings
```

o usuário escolhe:

```text
Chave da plataforma
Minha própria chave OpenAI
```

A API key pessoal é enviada ao backend por HTTPS, criptografada e armazenada no Neon.

A API nunca retorna o conteúdo da chave. Retorna apenas:

```json
{
  "hasOwnKey": true
}
```

## 4. Publicação

```powershell
cd D:\GitHub\prompthub

git status
git add .
git commit -m "Implementa Prompt Lab e chave propria de IA"
git push origin main
```

## 5. Teste

1. Rode as duas migrations.
2. Configure `AI_KEYS_ENCRYPTION_SECRET`.
3. Aguarde Render e Cloudflare.
4. Entre em `/settings`.
5. Selecione `Minha própria chave OpenAI`.
6. Cole uma API Key válida.
7. Salve.
8. Abra um prompt.
9. Clique em `Testar com IA`.
10. Execute.

Para conferir:

```sql
SELECT
  model,
  execution_mode,
  status,
  duration_ms,
  input_tokens,
  output_tokens,
  created_at
FROM prompt_runs
ORDER BY created_at DESC;
```

Para conferir a configuração sem revelar a chave:

```sql
SELECT
  user_id,
  provider,
  use_own_key,
  model,
  encrypted_api_key IS NOT NULL AS possui_chave
FROM user_ai_settings;
```
