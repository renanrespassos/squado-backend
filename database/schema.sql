-- ═══════════════════════════════════════════════════════════════
-- SQUADO — Schema PostgreSQL Multi-tenant
-- Versão 1.0 | squado.com.br
-- ═══════════════════════════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ───────────────────────────────────────────────────────────────
-- TENANTS (cada líder/empresa é um tenant)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(200) NOT NULL,
  email         VARCHAR(200) NOT NULL UNIQUE,
  senha_hash    TEXT NOT NULL,
  empresa       VARCHAR(200),
  segmento      VARCHAR(100),  -- laboratorio, mecanica, esportes, etc.

  -- Plano e faturamento
  plano         VARCHAR(20) NOT NULL DEFAULT 'trial'
                CHECK (plano IN ('trial','starter','pro','enterprise')),
  trial_expira  TIMESTAMP,
  assinatura_ativa BOOLEAN DEFAULT false,
  stripe_customer_id VARCHAR(100),
  mercadopago_id     VARCHAR(100),

  -- Configurações
  logo_url      TEXT,
  cor_primaria  VARCHAR(7) DEFAULT '#0F6E56',
  qtd_amostras  INT DEFAULT 500,

  -- Controle
  ativo         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- COLABORADORES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE colaboradores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  nome          VARCHAR(200) NOT NULL,
  nivel         VARCHAR(50),
  area          VARCHAR(100),
  status        VARCHAR(20) DEFAULT 'Ativo'
                CHECK (status IN ('Ativo','Férias','Afastado','Inativo','Desligado')),

  -- Dados pessoais
  email         VARCHAR(200),
  celular       VARCHAR(20),
  nascimento    DATE,
  cpf           VARCHAR(14),
  endereco      TEXT,
  formacao      TEXT,
  conhecimentos TEXT,
  obs           TEXT,

  -- Histórico de movimentações (JSON array)
  historico     JSONB DEFAULT '[]',

  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_colaboradores_tenant ON colaboradores(tenant_id);
CREATE INDEX idx_colaboradores_status ON colaboradores(tenant_id, status);

-- ───────────────────────────────────────────────────────────────
-- AVALIAÇÕES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE avaliacoes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id  UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,

  colaborador     VARCHAR(200) NOT NULL,
  nivel           VARCHAR(50),
  data            DATE NOT NULL,
  avaliador       VARCHAR(200),
  media_geral     DECIMAL(4,1),
  secao_medias    JSONB DEFAULT '{}',
  respostas       JSONB DEFAULT '{}',
  pontos_pos      TEXT,
  oportunidades   TEXT,

  criado_em       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_avaliacoes_tenant ON avaliacoes(tenant_id);
CREATE INDEX idx_avaliacoes_colaborador ON avaliacoes(colaborador_id);

-- ───────────────────────────────────────────────────────────────
-- NOTAS / ANOTAÇÕES
-- ───────────────────────────────────────────────────────────────
CREATE TABLE notas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,

  col_nome      VARCHAR(200),
  texto         TEXT NOT NULL,
  categoria     VARCHAR(50) DEFAULT 'Geral',
  sentimento    VARCHAR(20) DEFAULT 'neutro'
                CHECK (sentimento IN ('positivo','neutro','negativo')),
  data_hora     TIMESTAMP DEFAULT NOW(),

  criado_em     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notas_tenant ON notas(tenant_id);
CREATE INDEX idx_notas_colaborador ON notas(colaborador_id);

-- ───────────────────────────────────────────────────────────────
-- METAS (OKR + SMART)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE metas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,

  tipo          VARCHAR(10) NOT NULL CHECK (tipo IN ('okr','smart')),
  titulo        VARCHAR(300),
  objetivo      TEXT,       -- OKR
  area          VARCHAR(100),
  periodo       VARCHAR(50),
  key_results   JSONB DEFAULT '[]',  -- OKR

  -- SMART
  status        VARCHAR(30) DEFAULT 'Pendente',
  progresso     INT DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  prazo         DATE,
  colaborador   VARCHAR(200),
  especifica    TEXT,
  mensuravel    TEXT,
  atingivel     TEXT,
  relevante     TEXT,
  temporal      TEXT,

  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metas_tenant ON metas(tenant_id);

-- ───────────────────────────────────────────────────────────────
-- PDI — Plano de Desenvolvimento Individual
-- ───────────────────────────────────────────────────────────────
CREATE TABLE pdis (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,

  col_nome      VARCHAR(200),
  objetivo      TEXT,
  competencias  JSONB DEFAULT '[]',
  acoes         JSONB DEFAULT '[]',
  revisoes      JSONB DEFAULT '[]',
  proxima_revisao DATE,
  status        VARCHAR(30) DEFAULT 'Em andamento',

  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pdis_tenant ON pdis(tenant_id);
CREATE INDEX idx_pdis_colaborador ON pdis(colaborador_id);

-- ───────────────────────────────────────────────────────────────
-- FUNÇÕES DE CAPACIDADE
-- ───────────────────────────────────────────────────────────────
CREATE TABLE funcoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  nome          VARCHAR(200) NOT NULL,
  area          VARCHAR(100),
  tipo_tempo    VARCHAR(20) DEFAULT 'por_amostra'
                CHECK (tipo_tempo IN ('por_amostra','fixo_mes')),
  tempo_min     INT DEFAULT 10,
  pct_amostras  INT DEFAULT 100,
  responsaveis  JSONB DEFAULT '[]',

  criado_em     TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_funcoes_tenant ON funcoes(tenant_id);

-- ───────────────────────────────────────────────────────────────
-- NINE-BOX
-- ───────────────────────────────────────────────────────────────
CREATE TABLE ninebox (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id  UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,

  desempenho      INT CHECK (desempenho BETWEEN 1 AND 3),
  potencial       INT CHECK (potencial BETWEEN 1 AND 3),
  data_avaliacao  DATE DEFAULT CURRENT_DATE,

  UNIQUE(tenant_id, colaborador_id)
);

-- ───────────────────────────────────────────────────────────────
-- CONFIGURAÇÕES DO TENANT (valores, competências, perguntas)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE configuracoes (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE UNIQUE,

  valores           JSONB DEFAULT '{}',
  matriz_comp       JSONB DEFAULT '{}',
  perguntas         JSONB DEFAULT '{}',
  niveis            JSONB DEFAULT '[]',
  organograma_pos   JSONB DEFAULT '{}',
  organograma_conn  JSONB DEFAULT '[]',
  gestor_config     JSONB DEFAULT '{}',

  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- ───────────────────────────────────────────────────────────────
-- SESSÕES (autenticação JWT)
-- ───────────────────────────────────────────────────────────────
CREATE TABLE sessoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expira_em  TIMESTAMP NOT NULL,
  criado_em  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessoes_token ON sessoes(token_hash);
CREATE INDEX idx_sessoes_expira ON sessoes(expira_em);

-- ───────────────────────────────────────────────────────────────
-- FUNÇÃO: atualizar timestamp automaticamente
-- ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tenants_updated
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tr_colaboradores_updated
  BEFORE UPDATE ON colaboradores
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tr_metas_updated
  BEFORE UPDATE ON metas
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tr_pdis_updated
  BEFORE UPDATE ON pdis
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER tr_funcoes_updated
  BEFORE UPDATE ON funcoes
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();
