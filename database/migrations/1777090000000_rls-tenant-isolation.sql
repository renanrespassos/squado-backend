-- Up Migration: Habilitar Row-Level Security
-- Defesa em profundidade: mesmo que o código esqueça WHERE tenant_id=$1,
-- o Postgres garante que cada tenant só vê seus dados.

-- Policies usam current_setting('app.current_tenant_id') que é setado
-- pelo middleware Express antes de cada query.

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ninebox ENABLE ROW LEVEL SECURITY;

-- FORCE faz RLS valer até pro dono da tabela (squadouser)
ALTER TABLE configuracoes FORCE ROW LEVEL SECURITY;
ALTER TABLE colaboradores FORCE ROW LEVEL SECURITY;
ALTER TABLE metas FORCE ROW LEVEL SECURITY;
ALTER TABLE pdis FORCE ROW LEVEL SECURITY;
ALTER TABLE ninebox FORCE ROW LEVEL SECURITY;

-- Policies: permitem acesso somente quando tenant_id bate com a sessão
CREATE POLICY tenant_isolation ON configuracoes
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON colaboradores
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON metas
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON pdis
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

CREATE POLICY tenant_isolation ON ninebox
  USING (tenant_id::text = current_setting('app.current_tenant_id', true));

-- Down Migration

DROP POLICY IF EXISTS tenant_isolation ON configuracoes;
DROP POLICY IF EXISTS tenant_isolation ON colaboradores;
DROP POLICY IF EXISTS tenant_isolation ON metas;
DROP POLICY IF EXISTS tenant_isolation ON pdis;
DROP POLICY IF EXISTS tenant_isolation ON ninebox;

ALTER TABLE configuracoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE colaboradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE metas DISABLE ROW LEVEL SECURITY;
ALTER TABLE pdis DISABLE ROW LEVEL SECURITY;
ALTER TABLE ninebox DISABLE ROW LEVEL SECURITY;
