# PromptHub - instalação no Windows

## Pré-requisitos

- Node.js 20.19 ou superior
- npm
- Git
- Banco Neon criado

Verifique:

```powershell
node -v
npm -v
git --version
```

## 1. Limpar uma instalação anterior

Na raiz do projeto:

```powershell
cd D:\dsv\prompthub-mvp
powershell -ExecutionPolicy Bypass -File .\scripts\clean-install.ps1
```

Ou faça manualmente:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\web\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\database\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm cache verify
npm install
```

## 2. Banco Neon

Configure `DATABASE_URL` e execute a migration `packages/database/drizzle/0000_initial.sql` no Neon SQL Editor.

## 3. Variáveis da API

Crie `apps/api/.env`:

```env
DATABASE_URL=postgresql://...
AUTH_SECRET=troque-por-uma-chave-longa-e-aleatoria
FRONTEND_URL=http://localhost:3000
PORT=4000
NODE_ENV=development
```

## 4. Compilar banco e API

```powershell
npm run build:api
```

## 5. Executar API

```powershell
npm run dev:api
```

Teste:

```text
http://localhost:4000/health
```

## 6. Executar frontend Next.js

Em outro PowerShell:

```powershell
cd D:\dsv\prompthub-mvp
npm run dev:web
```

Abra:

```text
http://localhost:3000
```

## 7. Testar compatibilidade vinext

```powershell
npm run check:web
```

## 8. Executar frontend pelo vinext

```powershell
npm run dev:web:vinext
```

Abra:

```text
http://localhost:3001
```

## 9. Builds

```powershell
npm run build:api
npm run build:web
npm run build:web:vinext
```

## 10. Deploy

Depois que os testes locais estiverem funcionando:

- Render: publicar `apps/api`
- Cloudflare Workers: publicar `apps/web`
- Neon: permanece como PostgreSQL gerenciado
