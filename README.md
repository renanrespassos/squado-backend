# 🚀 Squado — Backend API

Plataforma SaaS multi-tenant de gestão de equipes para líderes.

## Stack
- **Node.js** + Express
- **PostgreSQL** (banco de dados)
- **JWT** (autenticação)
- **Railway** (hospedagem recomendada)

## Estrutura

```
squado/
├── backend/
│   ├── server.js              # Servidor Express principal
│   ├── db.js                  # Pool de conexão PostgreSQL
│   ├── .env.example           # Template de variáveis de ambiente
│   ├── middleware/
│   │   └── auth.js            # Middleware JWT + verificação de plano
│   └── routes/
│       ├── auth.js            # Login, registro, trocar senha
│       ├── colaboradores.js   # CRUD colaboradores
│       ├── avaliacoes.js      # CRUD avaliações
│       ├── notas.js           # CRUD notas/anotações
│       ├── metas.js           # CRUD metas OKR + SMART
│       ├── pdis.js            # CRUD PDIs
│       ├── funcoes.js         # CRUD funções de capacidade
│       ├── ninebox.js         # Nine-Box matriz
│       ├── config.js          # Configurações do tenant
│       └── tenant.js          # Dados do tenant/empresa
├── database/
│   ├── schema.sql             # Schema PostgreSQL completo
│   └── migrar.js              # Script migração localStorage → DB
└── frontend/
    └── (arquivos do sistema atual)
```

## Instalação local

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com suas credenciais

# Criar banco de dados
createdb squado
psql squado < ../database/schema.sql

# Iniciar servidor
npm run dev
```

## Deploy no Railway

1. Acesse [railway.app](https://railway.app) e crie conta
2. Crie novo projeto → Add PostgreSQL
3. Crie novo serviço → Deploy from GitHub
4. Configure as variáveis de ambiente:
   - `DATABASE_URL` (copiado do PostgreSQL no Railway)
   - `JWT_SECRET` (gere com: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://squado.com.br`
5. Deploy automático a cada push no GitHub

## Endpoints da API

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/registro` | Criar conta (trial 7 dias) |
| POST | `/api/auth/login` | Login |
| GET  | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/trocar-senha` | Alterar senha |

### Dados (todos requerem Bearer token)
| Método | Rota | Descrição |
|--------|------|-----------|
| GET/POST | `/api/colaboradores` | Listar/criar |
| GET/PUT/DELETE | `/api/colaboradores/:id` | Buscar/editar/excluir |
| PATCH | `/api/colaboradores/:id/desligar` | Desligar mantendo histórico |
| GET/POST | `/api/avaliacoes` | Avaliações |
| GET/POST | `/api/notas` | Anotações |
| GET/POST/PUT | `/api/metas` | Metas OKR + SMART |
| GET/POST/PUT | `/api/pdis` | PDIs |
| GET/POST/PUT | `/api/funcoes` | Funções de capacidade |
| GET/POST | `/api/ninebox` | Nine-Box |
| GET/PUT | `/api/config` | Configurações do tenant |
| GET/PUT | `/api/tenant` | Dados da empresa |

## Migração dos dados atuais

1. Deploy do backend
2. Crie sua conta em squado.com.br
3. Copie o token JWT do login
4. Abra o sistema antigo (gestao_pessoas_v6.html)
5. No console do browser, execute o conteúdo de `database/migrar.js`
6. Chame `migrarDados('seu_token_jwt')`

## Planos

| Plano | Preço | Features |
|-------|-------|----------|
| Trial | Grátis 7 dias | Tudo |
| Starter | R$79/mês | Colaboradores + PDI + Avaliações |
| Pro | R$149/mês | Tudo + IA |
| Enterprise | R$299/mês | Multi-usuário + Suporte |
