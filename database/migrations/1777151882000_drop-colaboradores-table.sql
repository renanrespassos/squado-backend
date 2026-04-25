-- Up Migration: Drop tabela colaboradores (morta desde Fase 3C)
--
-- A tabela acumulava rows stale do dual-write que foi eliminado.
-- Frontend usa snapshot_cols (configuracoes) como fonte única.
-- Antes de dropar, precisa remover as FK constraints em metas, pdis, ninebox.
-- (avaliacoes e notas já foram dropadas antes)

-- 1. Remover FK constraints
ALTER TABLE metas DROP CONSTRAINT IF EXISTS metas_colaborador_id_fkey;
ALTER TABLE pdis DROP CONSTRAINT IF EXISTS pdis_colaborador_id_fkey;
ALTER TABLE ninebox DROP CONSTRAINT IF EXISTS ninebox_colaborador_id_fkey;

-- 2. Drop a tabela
DROP TABLE IF EXISTS colaboradores;

-- Down Migration
-- Recria tabela vazia + FK constraints
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cargo VARCHAR(100),
  area VARCHAR(100),
  nivel VARCHAR(50),
  email VARCHAR(255),
  whatsapp VARCHAR(50),
  data_admissao DATE,
  ativo BOOLEAN DEFAULT true,
  historico JSONB DEFAULT '[]'::jsonb,
  obs TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

ALTER TABLE metas ADD CONSTRAINT metas_colaborador_id_fkey
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;
ALTER TABLE pdis ADD CONSTRAINT pdis_colaborador_id_fkey
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;
ALTER TABLE ninebox ADD CONSTRAINT ninebox_colaborador_id_fkey
  FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id) ON DELETE CASCADE;
