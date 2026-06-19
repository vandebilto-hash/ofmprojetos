# Guia de Deploy — OFM Systems Gestão de Projetos

> Documento para a IA com acesso à Vercel realizar o deploy do projeto.

---

## 1. Contexto do Projeto

| Campo | Valor |
|-------|-------|
| Nome do projeto | Gestão de Projetos — OFM Systems |
| Framework | Next.js 14 (App Router) |
| Estrutura | Monorepo — Next.js em `apps/web/` |
| Banco de dados | PostgreSQL via Supabase (já configurado em produção) |
| Autenticação | NextAuth.js com JWT |
| Storage | Supabase Storage (produção) |
| Serviço externo | MPP Service (Java) hospedado no Render.com |

---

## 2. Conta Vercel

| Campo | Valor |
|-------|-------|
| Team ID | `team_5hJOnTuqRLlwy1TyGicH6M4w` |
| Team slug | `vandebilto-hashs-projects` |
| Projetos existentes | `fluxjus`, `bioprotecao-pdi`, `missio-app` |
| Projeto a criar | **Novo projeto** — ainda não existe na conta |

---

## 3. Estrutura do Repositório

```
/ (raiz)
├── apps/
│   └── web/              ← App Next.js (build target)
│       ├── src/
│       ├── package.json
│       └── next.config.mjs
├── prisma/
│   └── schema.prisma     ← Schema Prisma (na RAIZ, não em apps/web)
├── package.json          ← Root com workspaces
├── vercel.json           ← Já criado (ver seção 4)
└── .env / .env.local     ← Variáveis de produção (não commitar)
```

---

## 4. Configuração `vercel.json` (já criado na raiz)

```json
{
  "buildCommand": "npx prisma generate --schema prisma/schema.prisma && npm run build -w apps/web",
  "installCommand": "npm install",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

> ⚠️ O Prisma schema fica na **raiz** do repo (`prisma/schema.prisma`), não dentro de `apps/web`. O build command faz o generate antes do next build.

---

## 5. Variáveis de Ambiente Obrigatórias

Configure todas no painel da Vercel em **Settings → Environment Variables** para os ambientes `Production` e `Preview`.

### 5.1 Banco de Dados — Supabase PostgreSQL

```env
# URL de conexão com pooling (Transaction mode - porta 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# URL direta sem pooling (para Prisma Migrate)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> 💡 Pegar no painel do Supabase em **Settings → Database → Connection string → Transaction pooler (port 6543)**.
> As URLs reais estão no arquivo `.env` local da máquina do usuário.

### 5.2 NextAuth

```env
NEXTAUTH_SECRET="gerar com: openssl rand -base64 32"
NEXTAUTH_URL="https://SEU-DOMINIO.vercel.app"
```

> ⚠️ `NEXTAUTH_URL` deve ser a URL final do deploy Vercel (pode ser atualizada após o primeiro deploy).

### 5.3 Storage — Supabase Storage

```env
MINIO_ENDPOINT="https://[ref].supabase.co/storage/v1/s3"
MINIO_REGION="sa-east-1"
MINIO_ACCESS_KEY="[supabase-access-key]"
MINIO_SECRET_KEY="[supabase-secret-key]"
MINIO_BUCKET="projete-se"
```

> 💡 Credenciais em Supabase → **Storage → S3 Connection**.

### 5.4 Serviço MPP (Importação MS Project)

```env
MPP_SERVICE_URL="https://mpp-service.onrender.com"
```

> ⚠️ Este serviço roda no Render.com (Java/Docker). A URL real está no `.env` local.
> Se não estiver disponível, a importação de arquivos `.mpp` não funcionará, mas o resto do app funciona normalmente.

### 5.5 Google OAuth (Opcional — não ativo ainda)

```env
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

> Pode deixar vazio. O login é feito via e-mail/senha.

---

## 6. Passos para Criar o Projeto na Vercel

### Opção A — Via CLI Vercel (recomendado)

```bash
# Na pasta raiz do projeto
cd "C:\Users\vandebilto.junior\Desktop\Aplicativo de gerenciamento"

# Login (se necessário)
npx vercel login

# Criar e fazer deploy
npx vercel deploy --prod

# Ao ser perguntado:
# - Set up and deploy? → Y
# - Which scope? → vandebilto-hashs-projects
# - Link to existing project? → N (criar novo)
# - Project name? → ofm-gestao-projetos (ou outro nome)
# - In which directory is your code located? → ./  (raiz)
# - Want to modify settings? → N (usa o vercel.json)
```

### Opção B — Via MCP Vercel (se a IA tiver acesso)

```
1. Criar novo projeto:
   - Team: team_5hJOnTuqRLlwy1TyGicH6M4w
   - Nome sugerido: ofm-gestao-projetos
   - Framework: Next.js
   - Root directory: / (raiz — o vercel.json já está lá)

2. Configurar as env vars da seção 5 acima

3. Disparar o primeiro deploy
```

### Opção C — Via Git Integration

```
1. Push do código para um repositório GitHub (se ainda não estiver)
2. No painel Vercel: Add New Project → Import Git Repository
3. Selecionar o repo
4. Framework: Next.js
5. Root Directory: ./ (deixar na raiz)
6. Build & Output Settings: virão do vercel.json automaticamente
7. Adicionar todas as env vars
8. Deploy
```

---

## 7. Configuração do Prisma para Produção

O `schema.prisma` precisa da variável `DIRECT_URL` para o Vercel conseguir fazer as migrações. Verifique se o schema tem:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  // necessário no Supabase com pooling
}
```

> Se não tiver `directUrl`, adicione. O `DATABASE_URL` com pooler (porta 6543) é para runtime; o `DIRECT_URL` sem pooler (porta 5432) é para o Prisma CLI.

---

## 8. Após o Primeiro Deploy

1. **Atualizar `NEXTAUTH_URL`** com a URL real gerada pela Vercel (ex: `https://ofm-gestao-projetos.vercel.app`)
2. **Redeploy** para aplicar a variável atualizada
3. **Testar** o login em `/login` com as credenciais do banco de produção
4. **Verificar** se o dashboard carrega em `/dashboard`

---

## 9. Verificação de Build Local (Opcional)

Antes do deploy, verificar se o build passa localmente:

```bash
cd "C:\Users\vandebilto.junior\Desktop\Aplicativo de gerenciamento"

# Type check (deve retornar sem erros)
npx tsc --noEmit -p apps/web/tsconfig.json

# Build completo
npm run build
```

> ✅ O type check já foi executado e passou com **zero erros**.

---

## 10. Problemas Conhecidos / Atenção

| Problema | Solução |
|----------|---------|
| Build falha com erro Prisma | Verificar se `DATABASE_URL` está configurada nas env vars Vercel |
| `NEXTAUTH_URL` errado | Atualizar para URL final do deploy e redeploy |
| Importação MPP não funciona | Serviço Java no Render.com pode estar em sleep (plano free) |
| Erro de CORS no Storage | Configurar CORS no Supabase Storage para o domínio Vercel |
| Fonts não carregam | Plus Jakarta Sans é carregada via Google Fonts — precisa de conexão externa |

---

## 11. Arquivos Críticos

| Arquivo | Propósito |
|---------|-----------|
| `vercel.json` | Configuração de build do monorepo |
| `prisma/schema.prisma` | Schema do banco (raiz do repo) |
| `apps/web/next.config.mjs` | Configuração Next.js |
| `apps/web/src/app/layout.tsx` | Root layout |
| `apps/web/src/lib/auth/options.ts` | Config NextAuth |
| `apps/web/src/lib/prisma/client.ts` | Singleton do Prisma client |

---

_Gerado em: 2026-06-19 | Projeto: OFM Systems Gestão de Projetos_
