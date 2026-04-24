-- Up Migration

-- Drop de 3 tabelas mortas que existem desde o início mas nunca foram lidas
-- pelo frontend. Frontend salva esses dados via configuracoes.snapshot_*
-- (que NÃO são tocados aqui).
--
-- Confirmado em 2026-04-24:
--   - funcoes:    0 rows  (frontend nunca chamou /api/funcoes)
--   - avaliacoes: 0 rows  (só usado em squadoMigrarDados one-time, nunca executado)
--   - notas:      0 rows  (idem)

DROP TABLE IF EXISTS funcoes;
DROP TABLE IF EXISTS avaliacoes;
DROP TABLE IF EXISTS notas;

-- Down Migration

-- Recria as 3 tabelas com o schema original (vazias).
-- Note: rollback NÃO restaura dados — eram zero rows quando dropei.

CREATE TABLE IF NOT EXISTS funcoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  nivel VARCHAR(50),
  descricao TEXT,
  competencias JSONB DEFAULT '[]'::jsonb,
  responsabilidades JSONB DEFAULT '[]'::jsonb,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  periodo VARCHAR(50),
  notas JSONB DEFAULT '{}'::jsonb,
  media NUMERIC(3,2),
  criado_em TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50),
  criado_em TIMESTAMP DEFAULT NOW()
);
