# Fase 7 - Testes obrigatórios de isolamento

Use dois usuários reais de teste criados pelo cadastro da aplicação.

1. Usuário A cria prompt PRIVATE.
2. Usuário B tenta GET /api/prompts/:id. Deve receber 404.
3. Usuário B tenta PATCH /api/prompts/:id. Deve receber 404.
4. Usuário B tenta DELETE /api/prompts/:id. Deve receber 404.
5. Usuário A muda o prompt para PUBLIC.
6. Usuário B passa a conseguir GET.
7. Usuário B continua sem conseguir PATCH ou DELETE.
8. Usuário B pode favoritar.
9. Usuário B pode criar fork.
10. O fork pertence ao usuário B e nasce PRIVATE.
11. Alterações no fork não alteram o original.
12. Usuário B cria prompt PRIVATE e o usuário A não pode acessá-lo.

Não aceite user_id enviado pelo frontend em nenhum endpoint de escrita.
