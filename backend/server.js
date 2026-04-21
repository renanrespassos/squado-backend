require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1); // Cloud Run / proxy

// ── Segurança ─────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '10mb' }));

// Rate limit geral
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' }
}));

// Rate limit mais restrito para auth
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { erro: 'Muitas tentativas de login.' }
});

// ── Rotas ─────────────────────────────────────────────────────
app.use('/api/auth',          authLimit, require('./routes/auth'));
app.use('/api/colaboradores', require('./middleware/auth'), require('./routes/colaboradores'));
app.use('/api/avaliacoes',    require('./middleware/auth'), require('./routes/avaliacoes'));
app.use('/api/notas',         require('./middleware/auth'), require('./routes/notas'));
app.use('/api/metas',         require('./middleware/auth'), require('./routes/metas'));
app.use('/api/pdis',          require('./middleware/auth'), require('./routes/pdis'));
app.use('/api/funcoes',       require('./middleware/auth'), require('./routes/funcoes'));
app.use('/api/ninebox',       require('./middleware/auth'), require('./routes/ninebox'));
app.use('/api/config',        require('./middleware/auth'), require('./routes/config'));
app.use('/api/tenant',        require('./middleware/auth'), require('./routes/tenant'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', versao: '1.0.0', produto: 'Squado' });
});

// ── Erro global ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 Squado API rodando na porta ${PORT}`);
  console.log(`   http://localhost:${PORT}/api/health\n`);
});


// ── Migração de banco ─────────────────────────────
app.post('/api/__migrate__', async (req, res) => {
  if(req.headers['x-migrate-key'] !== 'squado_migrate_2024') return res.status(403).json({erro:'Proibido'});
  const { query } = require('./db');
  const fs = require('fs');
  const path = require('path');
  try {
    // Adicionar colunas faltantes na tabela metas
    const sqls = [
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS tipo VARCHAR(10)`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS objetivo TEXT`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS area VARCHAR(100)`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS periodo VARCHAR(50)`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS key_results JSONB DEFAULT '[]'`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Pendente'`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS progresso INT DEFAULT 0`,
      `ALTER TABLE metas ADD COLUMN IF NOT EXISTS colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL`,
    ];
    const results = [];
    for(const sql of sqls){
      try{ await query(sql); results.push('OK: '+sql.slice(0,50)); }
      catch(e){ results.push('ERR: '+e.message.slice(0,80)); }
    }
    res.json({ok:true, results});
  } catch(e){ res.status(500).json({erro:e.message}); }
});

module.exports = app;
