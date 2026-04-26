require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const pino      = require('pino');
const pinoHttp  = require('pino-http');
const { query } = require('./db');

// ── Logger estruturado ────────────────────────────────────────────
// Produção: JSON para Cloud Logging. Dev: pode ser plain via LOG_LEVEL.
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.body.senha', 'req.body.senhaAtual', 'req.body.novaSenha'],
    censor: '[REDACTED]',
  },
});

const app = express();
app.set('trust proxy', 1); // Cloud Run / proxy

// HTTP request logging (adiciona req.log automaticamente)
app.use(pinoHttp({ logger }));

// ── Segurança ─────────────────────────────────────────────────────
app.use(helmet());

// CORS: aceita lista de origins separada por vírgula no FRONTEND_URL.
// Ex: FRONTEND_URL="https://squado.com.br,https://www.squado.com.br"
// Wildcard ainda suportado pra desenvolvimento (FRONTEND_URL="*").
const rawOrigins = (process.env.FRONTEND_URL || '*').split(',').map(s => s.trim()).filter(Boolean);
const corsOrigin = (rawOrigins.length === 1 && rawOrigins[0] === '*') ? '*' : rawOrigins;
if (corsOrigin === '*' && process.env.NODE_ENV === 'production') {
  logger.warn('FRONTEND_URL=* em produção — CORS aceita qualquer origin. Considere restringir.');
}
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

app.use(express.json({ limit: '10mb' }));

// ── Rate limit geral ──────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
}));

// ── Rate limit de auth (IP + email combinados) ────────────────────
// Antes: só IP → um atacante num mesmo IP saturava a janela de IPs legítimos.
// Agora: chave = `${ip}:${email}`. Máx 50 tentativas por (IP, email) em 15 min.
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body && req.body.email ? String(req.body.email) : '').toLowerCase().trim();
    return email ? `${req.ip}:${email}` : req.ip;
  },
  message: { erro: 'Muitas tentativas de login.' },
});

// ── Rotas ─────────────────────────────────────────────────────────
app.use('/api/auth',          authLimit, require('./routes/auth'));
app.use('/api/metas',         require('./middleware/auth'), require('./routes/metas'));
app.use('/api/pdis',          require('./middleware/auth'), require('./routes/pdis'));
app.use('/api/ninebox',       require('./middleware/auth'), require('./routes/ninebox'));
app.use('/api/config',        require('./middleware/auth'), require('./routes/config'));
app.use('/api/tenant',        require('./middleware/auth'), require('./routes/tenant'));
app.use('/api/admin',         require('./middleware/auth'), require('./middleware/admin'), require('./routes/admin'));
app.use('/api/ai',            require('./middleware/auth'), require('./routes/ai'));
app.use('/api/cron',          require('./routes/cron'));

// ── Health check (real: toca o banco) ─────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'ok', versao: '1.0.0', produto: 'Squado' });
  } catch (err) {
    req.log.error({ err: err.message }, 'Health check failed: database unreachable');
    res.status(503).json({ status: 'degraded', db: 'down', erro: 'Database unreachable' });
  }
});

// ── Erro global ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  req.log.error({ err: err.message, stack: err.stack, path: req.path }, 'Unhandled error');
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'Squado API online');
});

module.exports = app;
