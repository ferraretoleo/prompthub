# Novo layout estilo GitHub

Substitua estes arquivos no projeto:

- apps/web/app/globals.css
- apps/web/components/AppShell.tsx
- apps/web/components/PromptCard.tsx
- apps/web/app/dashboard/page.tsx

Depois:

```powershell
cd D:\GitHub\prompthub
git add .
git commit -m "Redesenha layout do PromptHub no estilo GitHub"
git push origin main
```

O Cloudflare fará o deploy automaticamente.

Principais mudanças:

- uso de praticamente toda a largura da tela
- barra superior horizontal
- sidebar compacta
- feed central removido
- lista de prompts em estilo repositório
- menos arredondamento
- cores próximas de ferramentas técnicas
- busca no topo
- navegação mais parecida com produto SaaS/GitHub
- responsividade para desktop, tablet e celular
