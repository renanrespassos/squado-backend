// routes/avaliacoes.js
const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM avaliacoes WHERE tenant_id=$1 ORDER BY data DESC',
    [req.tenantId]
  );
  res.json(rows);
});

router.get('/colaborador/:colId', async (req, res) => {
  const { rows } = await query(
    'SELECT * FROM avaliacoes WHERE tenant_id=$1 AND colaborador_id=$2 ORDER BY data DESC',
    [req.tenantId, req.params.colId]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { colaborador_id, colaborador, nivel, data, avaliador, media_geral, secao_medias, respostas, pontos_pos, oportunidades } = req.body;
  const { rows } = await query(
    `INSERT INTO avaliacoes (tenant_id, colaborador_id, colaborador, nivel, data, avaliador, media_geral, secao_medias, respostas, pontos_pos, oportunidades)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.tenantId, colaborador_id||null, colaborador, nivel||'', data, avaliador||'', media_geral||0,
     JSON.stringify(secao_medias||{}), JSON.stringify(respostas||{}), pontos_pos||'', oportunidades||'']
  );
  res.status(201).json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  await query('DELETE FROM avaliacoes WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});

module.exports = router;
