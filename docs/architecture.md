# Projete-se

Sistema completo de gerenciamento de projetos self-hosted e sem licencas obrigatorias pagas.

## Stack

- Next.js App Router, React, TypeScript e Tailwind CSS.
- PostgreSQL via Docker.
- Prisma como ORM.
- Auth.js/NextAuth com credenciais e Google OAuth.
- MinIO para armazenamento S3 compativel.
- MPXJ em microservico Java para importacao MPP.
- Exportacao MSPDI XML para compatibilidade com Microsoft Project.

## Regras implementadas na fundacao

- RBAC no backend para administradores, gestores, funcionarios e clientes.
- Tarefas atrasadas aparecem em vermelho.
- Funcionarios sobrealocados aparecem em vermelho.
- Projeto e tarefa registram auditoria em alteracoes de criacao.
- Baseline e snapshot de tarefas sao imutaveis por desenho de dados.
- Apontamentos de horas recalculam horas de tarefa e projeto.
- Cliente possui campo `clientId` para isolamento de dados.

## Credenciais de seed

- admin@projete.local / Projete@123
- gestor@projete.local / Projete@123
- funcionario@projete.local / Projete@123
- cliente@projete.local / Projete@123
