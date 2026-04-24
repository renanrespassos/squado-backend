const router = require('express').Router();
const { query } = require('../db');
const { v4: uuid } = require('uuid');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

// GET /api/colaboradores
router.get('/', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM colaboradores WHERE tenant_id = $1 ORDER BY nome`,
      [req.tenantId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar colaboradores.' });
  }
});

// GET /api/colaboradores/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM colaboradores WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar colaborador.' });
  }
});

// POST /api/colaboradores
router.post('/', validate(schemas.colaboradorCreate), async (req, res) => {
  const { nome, nivel, area, status, email, celular, nascimento, cpf, endereco, formacao, conhecimentos, obs, historico } = req.body;

  try {
    const { rows } = await query(
      `INSERT INTO colaboradores
        (tenant_id, nome, nivel, area, status, email, celular, nascimento, cpf, endereco, formacao, conhecimentos, obs, historico)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.tenantId, nome, nivel||'', area||'', status||'Ativo', email||'', celular||'',
       nascimento||null, cpf||'', endereco||'', formacao||'', conhecimentos||'', obs||'',
       JSON.stringify(historico||[])]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar colaborador.' });
  }
});

// PUT /api/colaboradores/:id
router.put('/:id', validate(schemas.colaboradorUpdate), async (req, res) => {
  const { nome, nivel, area, status, email, celular, nascimento, cpf, endereco, formacao, conhecimentos, obs, historico } = req.body;

  try {
    const { rows } = await query(
      `UPDATE colaboradores SET
        nome=$1, nivel=$2, area=$3, status=$4, email=$5, celular=$6,
        nascimento=$7, cpf=$8, endereco=$9, formacao=$10,
        conhecimentos=$11, obs=$12, historico=$13
       WHERE id=$14 AND tenant_id=$15
       RETURNING *`,
      [nome, nivel||'', area||'', status||'Ativo', email||'', celular||'',
       nascimento||null, cpf||'', endereco||'', formacao||'', conhecimentos||'', obs||'',
       JSON.stringify(historico||[]),
       req.params.id, req.tenantId]
    );
    if (!rows.length) return res.status(404).json({ erro: 'Não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar colaborador.' });
  }
});

// DELETE /api/colaboradores/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query(
      'DELETE FROM colaboradores WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!rowCount) return res.status(404).json({ erro: 'Não encontrado.' });
    res.json({ mensagem: 'Colaborador excluído.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir colaborador.' });
  }
});

// PATCH /api/colaboradores/:id/desligar
router.patch('/:id/desligar', async (req, res) => {
  try {
    const { rows: current } = await query(
      'SELECT historico FROM colaboradores WHERE id=$1 AND tenant_id=$2',
      [req.params.id, req.tenantId]
    );
    if (!current.length) return res.status(404).json({ erro: 'Não encontrado.' });

    const historico = current[0].historico || [];
    historico.push({
      data: new Date().toISOString().slice(0,10),
      tipo: 'Desligamento',
      descricao: 'Vínculo encerrado. Colaborador desligado da equipe.'
    });

    const { rows } = await query(
      'UPDATE colaboradores SET status=$1, historico=$2 WHERE id=$3 AND tenant_id=$4 RETURNING *',
      ['Desligado', JSON.stringify(historico), req.params.id, req.tenantId]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao desligar colaborador.' });
  }
});

module.exports = router;
