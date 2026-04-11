const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM notas WHERE tenant_id=$1 ORDER BY data_hora DESC', [req.tenantId]);
  res.json(rows);
});
router.post('/', async (req, res) => {
  const { colaborador_id, col_nome, texto, categoria, sentimento, data_hora } = req.body;
  const { rows } = await query(
    'INSERT INTO notas (tenant_id,colaborador_id,col_nome,texto,categoria,sentimento,data_hora) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.tenantId, colaborador_id||null, col_nome||'Geral', texto, categoria||'Geral', sentimento||'neutro', data_hora||new Date()]
  );
  res.status(201).json(rows[0]);
});
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM notas WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});
module.exports = router;
