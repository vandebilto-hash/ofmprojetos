# Projete-se

Webapp self-hosted de gerenciamento de projetos, sem licencas obrigatorias pagas.

## Como rodar localmente

1. Copie `.env.example` para `.env`.
2. Suba banco, MinIO e servico MPXJ:

```bash
docker compose up -d
```

3. Instale dependencias:

```bash
npm install
```

4. Gere o Prisma Client, crie o schema e rode o seed:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. Inicie o app:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Login de demonstracao

- `admin@projete.local` / `Projete@123`
- `gestor@projete.local` / `Projete@123`
- `funcionario@projete.local` / `Projete@123`
- `cliente@projete.local` / `Projete@123`

## Entregue nesta primeira implementacao

- Next.js App Router com layout desktop-first.
- PostgreSQL, Prisma e Docker Compose.
- Auth.js/NextAuth com credenciais e Google OAuth preparado.
- RBAC para perfis principais.
- Modelagem relacional ampla para projetos, tarefas, baseline, recursos, horas, documentos, relatorios e auditoria.
- Dashboard por dados reais do banco.
- CRUD inicial de projetos, tarefas, usuarios e clientes.
- Gantt gratuito customizado com baseline, atraso e caminho critico.
- Kanban, cronograma, recursos, horas, documentos, relatorios e administracao.
- Exportacao Excel, PDF e MSPDI XML.
- Microservico MPXJ para importacao MPP.
