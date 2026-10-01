$ErrorActionPreference = "Stop"

Write-Host "PromptHub - limpeza de dependencias" -ForegroundColor Cyan

$paths = @(
    "node_modules",
    "apps/web/node_modules",
    "apps/api/node_modules",
    "packages/database/node_modules"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Write-Host "Removendo $path"
        Remove-Item -Recurse -Force $path
    }
}

if (Test-Path "package-lock.json") {
    Write-Host "Removendo package-lock.json antigo"
    Remove-Item -Force "package-lock.json"
}

Write-Host "Verificando cache do npm"
npm cache verify

Write-Host "Instalando dependencias"
npm install

Write-Host "\nInstalacao concluida." -ForegroundColor Green
Write-Host "Proximo teste: npm run build:api"
Write-Host "Depois: npm run build:web"
