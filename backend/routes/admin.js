const router = require('express').Router();
const { queryNoRLS: query } = require('../db');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

// Listar todos tenants (com contadores basicos)
router.get('/tenants', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        t.id, t.nome, t.email, t.empresa, t.plano,
        t.trial_expira, t.assinatura_ativa, t.ativo,
        t.criado_em,
        (SELECT COUNT(*) FROM colaboradores c WHERE c.tenant_id = t.id) AS qtd_colaboradores,
        (SELECT COUNT(*) FROM metas m WHERE m.tenant_id = t.id) AS qtd_metas
      FROM tenants t
      ORDER BY t.criado_em DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error('admin /tenants err', e);
    res.status(500).json({ erro: 'Erro ao listar tenants.' });
  }
});

// Estender trial em N dias (a partir de hoje OU da data atual de expiracao, o que for maior)
router.post('/tenants/:id/extend-trial', validate(schemas.adminExtendTrial), async (req, res) => {
  const { id } = req.params;
  const { days } = req.body;
  try {
    const { rows } = await query(`
      UPDATE tenants
      SET trial_expira = GREATEST(NOW(), COALESCE(trial_expira, NOW())) + (INTERVAL '1 day' * $1)
      WHERE id = $2
      RETURNING id, nome, email, plano, trial_expira
    `, [days, id]);
    if (!rows.length) return res.status(404).json({ erro: 'Tenant nao encontrado.' });
    res.json(rows[0]);
  } catch (e) {
    console.error('admin extend-trial err', e);
    res.status(500).json({ erro: 'Erro ao estender trial.' });
  }
});

// Trocar plano (trial | standard | pro)
router.put('/tenants/:id/plano', validate(schemas.adminPlano), async (req, res) => {
  const { id } = req.params;
  const { plano } = req.body;
  try {
    // Se for upgrade para standard/pro, marcar assinatura_ativa=true e limpar trial_expira
    // Se for downgrade para trial, dar 7 dias a partir de hoje
    let sql;
    let params;
    if (plano === 'trial') {
      sql = `UPDATE tenants SET plano = $1, trial_expira = NOW() + INTERVAL '7 days', assinatura_ativa = false
             WHERE id = $2 RETURNING id, nome, email, plano, trial_expira, assinatura_ativa`;
      params = [plano, id];
    } else {
      sql = `UPDATE tenants SET plano = $1, assinatura_ativa = true, trial_expira = NULL
             WHERE id = $2 RETURNING id, nome, email, plano, trial_expira, assinatura_ativa`;
      params = [plano, id];
    }
    const { rows } = await query(sql, params);
    if (!rows.length) return res.status(404).json({ erro: 'Tenant nao encontrado.' });
    res.json(rows[0]);
  } catch (e) {
    console.error('admin trocar plano err', e);
    res.status(500).json({ erro: 'Erro ao trocar plano.' });
  }
});

// Ativar/desativar conta
router.put('/tenants/:id/ativo', validate(schemas.adminAtivo), async (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;
  try {
    const { rows } = await query(
      'UPDATE tenants SET ativo = $1 WHERE id = $2 RETURNING id, nome, email, ativo',
      [ativo, id]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Tenant nao encontrado.' });
    res.json(rows[0]);
  } catch (e) {
    console.error('admin ativo err', e);
    res.status(500).json({ erro: 'Erro ao alterar status.' });
  }
});

module.exports = router;
