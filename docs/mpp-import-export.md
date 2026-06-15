# Importacao e exportacao Microsoft Project

O Projete-se nao promete exportacao binaria `.mpp`, pois esse formato tem limitacoes praticas no ecossistema gratuito.

Abordagem gratuita:

- Importacao `.mpp`: microservico Java com MPXJ lendo o arquivo e retornando tarefas normalizadas.
- Exportacao: MSPDI XML gerado pelo Next.js, formato aceito pelo Microsoft Project.
- Futuro: enriquecer exportacao com recursos, calendarios, dependencias e linhas base.
