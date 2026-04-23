const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { query } = require('../db');

// ââ POST /api/auth/registro âââââââââââââââââââââââââââââââââââ
router.post('/registro', async (req, res) => {
  const { nome, email, senha, empresa, segmento } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, email e senha sÃ£o obrigatÃ³rios.' });
  }
  if (senha.length < 8) {
    return res.status(400).json({ erro: 'Senha deve ter pelo menos 8 caracteres.' });
  }

  try {
    // Verificar se email jÃ¡ existe
    const existe = await query('SELECT id FROM tenants WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows.length) {
      return res.status(409).json({ erro: 'Email jÃ¡ cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    // Trial de 7 dias
    const trialExpira = new Date();
    trialExpira.setDate(trialExpira.getDate() + 7);

    const { rows } = await query(
      `INSERT INTO tenants (nome, email, senha_hash, empresa, segmento, plano, trial_expira)
       VALUES ($1, $2, $3, $4, $5, 'trial', $6)
       RETURNING id, nome, email, plano, trial_expira`,
      [nome, email.toLowerCase(), senhaHash, empresa || '', segmento || '', trialExpira]
    );

    const tenant = rows[0];

    // Criar configuraÃ§Ãµes padrÃ£o
    await query(
      'INSERT INTO configuracoes (tenant_id) VALUES ($1)',
      [tenant.id]
    );

    const token = gerarToken(tenant.id);
    res.status(201).json({
      mensagem: 'Conta criada! Trial de 7 dias ativo.',
      token,
      tenant: { id: tenant.id, nome: tenant.nome, email: tenant.email, plano: tenant.plano, trialExpira: tenant.trial_expira }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar conta.' });
  }
});

// ââ POST /api/auth/login ââââââââââââââââââââââââââââââââââââââ
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha sÃ£o obrigatÃ³rios.' });
  }

  try {
    const { rows } = await query(
      'SELECT id, nome, email, senha_hash, plano, trial_expira, assinatura_ativa, ativo FROM tenants WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!rows.length) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }

    const tenant = rows[0];
    if (!tenant.ativo) {
      return res.status(401).json({ erro: 'Conta desativada.' });
    }

    const senhaOk = await bcrypt.compare(senha, tenant.senha_hash);
    if (!senhaOk) {
      return res.status(401).json({ erro: 'Email ou senha incorretos.' });
    }

    const token = gerarToken(tenant.id);
    res.json({
      token,
      tenant: {
        id: tenant.id,
        nome: tenant.nome,
        email: tenant.email,
        plano: tenant.plano,
        trialExpira: tenant.trial_expira,
        assinaturaAtiva: tenant.assinatura_ativa,
        isAdmin: ((process.env.ADMIN_EMAILS||'').split(',').map(e=>e.trim().toLowerCase()).filter(Boolean)).includes((tenant.email||'').toLowerCase())
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fazer login.' });
  }
});

// ââ GET /api/auth/me ââââââââââââââââââââââââââââââââââââââââââ
router.get('/me', require('../middleware/auth'), async (req, res) => {
  res.json({ tenant: req.tenant });
});

// ââ POST /api/auth/trocar-senha âââââââââââââââââââââââââââââââ
router.post('/trocar-senha', require('../middleware/auth'), async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha || novaSenha.length < 8) {
    return res.status(400).json({ erro: 'Dados invÃ¡lidos.' });
  }

  try {
    const { rows } = await query('SELECT senha_hash FROM tenants WHERE id = $1', [req.tenantId]);
    const ok = await bcrypt.compare(senhaAtual, rows[0].senha_hash);
    if (!ok) return res.status(401).json({ erro: 'Senha atual incorreta.' });

    const novoHash = await bcrypt.hash(novaSenha, 12);
    await query('UPDATE tenants SET senha_hash = $1 WHERE id = $2', [novoHash, req.tenantId]);
    res.json({ mensagem: 'Senha alterada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao trocar senha.' });
  }
});

function gerarToken(tenantId) {
  return jwt.sign(
    { tenantId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

module.exports = router;
