const jwt  = require('jsonwebtoken');
const { query } = require('../db');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se o tenant ainda está ativo
    const { rows } = await query(
      'SELECT id, nome, email, plano, trial_expira, assinatura_ativa, ativo FROM tenants WHERE id = $1',
      [payload.tenantId]
    );

    if (!rows.length || !rows[0].ativo) {
      return res.status(401).json({ erro: 'Conta não encontrada ou desativada.' });
    }

    const tenant = rows[0];

    // Verificar plano/trial
    if (tenant.plano === 'trial' && tenant.trial_expira) {
      if (new Date() > new Date(tenant.trial_expira)) {
        return res.status(402).json({
          erro: 'Trial expirado.',
          codigo: 'TRIAL_EXPIRADO',
          mensagem: 'Seu período gratuito terminou. Escolha um plano para continuar.'
        });
      }
    }

    req.tenant   = tenant;
    req.tenantId = tenant.id;
    next();
  } catch (err) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
};
