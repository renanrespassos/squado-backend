# Squado — Backend API

Plataforma SaaS multi-tenant de gestão de equipes para líderes.

## Stack

- **Node.js 20** + Express
- **PostgreSQL 15** (Cloud SQL)
- **JWT** (HS256, 30 dias)
- **Pino** (logs estruturados)
- **Cloud Run** + **Secret Manager** (deploy)

## Estrutura

```
squado-backend/
├── backend/
│   ├── server.js                # Express + middlewares globais
│   ├── db.js                    # Pool pg
│   ├── .env.example             # Template de variáveis
│   ├── middleware/
│   │   ├── auth.js              # JWT + verificação tenant + trial
│   │   └── admin.js             # requireAdmin (ADMIN_EMAILS)
│   └── routes/
│       ├── auth.js              # Login, registro, trocar senha, /me
│       ├── colaboradores.js     # CRUD
│       ├── metas.js             # CRUD (OKR + SMART)
│       ├── pdis.js              # CRUD
│       ├── ninebox.js           # Nine-Box (matriz talentos)
│       ├── config.js            # Snapshot agregado por tenant
│       ├── tenant.js            # Dados da conta
│       └── admin.js             # /api/admin/* (gestão de tenants)
├── database/
│   └── schema.sql               # Schema PostgreSQL (baseline)
├── Dockerfile                   # node:20-alpine
└── .github/workflows/deploy.yml # CI: deploy automático no push pra main
```

## Instalação local

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com credenciais

# Banco local (opcional — em produção usamos Cloud SQL)
createdb squado
psql squado < ../database/schema.sql

# Iniciar
npm run dev
```

## Deploy em Cloud Run

Deploy automático a cada push em `main` via GitHub Actions
(`.github/workflows/deploy.yml`).

### Configuração inicial

1. Cloud SQL: instância PostgreSQL 15 na região `us-central1`
2. Secret Manager: criar secrets
   - `database-url` (formato `postgresql://user:pass@/db?host=/cloudsql/...`)
   - `jwt-secret` (gere com `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
3. Cloud Run: serviço `squado-api` na região `us-central1`
   - Service Account precisa de `roles/cloudsql.client` e `roles/secretmanager.secretAccessor`
4. GitHub Secrets do repo:
   - `GCP_SA_KEY`: chave JSON do SA com permissão de deploy
     *(ou configure Workload Identity Federation — recomendado)*

### Deploy manual (Cloud Shell autenticado)

```bash
gcloud run deploy squado-api \
  --source . \
  --region us-central1 \
  --set-env-vars '^|^FRONTEND_URL=https://squado.com.br,https://www.squado.com.br|NODE_ENV=production|PGSSLMODE=disable|ADMIN_EMAILS=seu@email.com' \
  --update-secrets 'DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest'
```

## Endpoints

### Públicas (rate limit 20/15min por IP+email)
| Método | Rota                       | Descrição                |
|--------|----------------------------|--------------------------|
| POST   | `/api/auth/registro`       | Criar conta (trial 30d)  |
| POST   | `/api/auth/login`          | Login                    |
| GET    | `/api/health`              | Health check + DB check  |

### Autenticadas (Bearer JWT, rate limit 200/15min por IP)
| Método              | Rota                                     | Descrição                       |
|---------------------|------------------------------------------|---------------------------------|
| GET                 | `/api/auth/me`                           | Dados do tenant logado          |
| POST                | `/api/auth/trocar-senha`                 | Alterar senha                   |
| GET / POST          | `/api/colaboradores`                     | Listar / criar                  |
| GET / PUT / DELETE  | `/api/colaboradores/:id`                 | Detalhe / editar / excluir      |
| PATCH               | `/api/colaboradores/:id/desligar`        | Desligar mantendo histórico     |
| GET / POST / PUT    | `/api/metas`                             | CRUD (OKR + SMART)              |
| GET / POST / PUT    | `/api/pdis`                              | CRUD                            |
| GET / POST / DELETE | `/api/ninebox`                           | Posições nine-box               |
| GET / PUT           | `/api/config`                            | Snapshot agregado (legacy+live) |
| GET / PUT           | `/api/tenant`                            | Dados da empresa                |

### Admin (requer email em `ADMIN_EMAILS`)
| Método | Rota                                     | Descrição                       |
|--------|------------------------------------------|---------------------------------|
| GET    | `/api/admin/tenants`                     | Listar todas as contas          |
| POST   | `/api/admin/tenants/:id/extend-trial`    | Estender trial                  |
| PUT    | `/api/admin/tenants/:id/plano`           | Alterar plano                   |
| PUT    | `/api/admin/tenants/:id/ativo`           | Ativar / desativar conta        |

## Variáveis de ambiente

Veja `backend/.env.example`. Em produção (Cloud Run):
- `DATABASE_URL` e `JWT_SECRET` — vêm do Secret Manager
- `FRONTEND_URL`, `NODE_ENV`, `PGSSLMODE`, `ADMIN_EMAILS` — env vars normais

## Planos

| Plano      | Trial inicial | Features                                      |
|------------|---------------|-----------------------------------------------|
| Trial      | 30 dias       | Tudo (após expira, requer upgrade)            |
| Pro        | —             | Acesso completo                               |

## Observabilidade

Logs estruturados em JSON via Pino, parseados nativamente pelo Cloud Logging.
- Filtro por revisão: `resource.labels.revision_name=squado-api-XXXXX`
- Filtro por nível: `jsonPayload.level>=40` (warn+)
- Senhas e tokens são automaticamente redacted antes de logar
