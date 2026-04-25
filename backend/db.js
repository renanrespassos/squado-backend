const { Pool } = require('pg');
const { AsyncLocalStorage } = require('async_hooks');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Cloud SQL via socket Unix não usa SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Erro no pool de conexão PostgreSQL:', err);
});

// AsyncLocalStorage pra propagar tenant_id automaticamente
const tenantContext = new AsyncLocalStorage();

// Query com RLS automático: se há tenant context, faz SET LOCAL dentro de transação
const query = async (text, params) => {
  const ctx = tenantContext.getStore();
  if (ctx && ctx.tenantId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`SET LOCAL app.current_tenant_id = '${ctx.tenantId}'`);
      const result = await client.query(text, params);
      await client.query('COMMIT');
      return result;
    } catch(e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
  // Sem tenant context (health check, auth, admin): query direto no pool
  return pool.query(text, params);
};

// Query SEM RLS (pra admin que precisa ver todos os tenants)
const queryNoRLS = (text, params) => pool.query(text, params);

// Helper para transações
const getClient = () => pool.connect();

module.exports = { query, queryNoRLS, getClient, pool, tenantContext };
