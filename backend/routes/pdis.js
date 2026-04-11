const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM pdis WHERE tenant_id=$1 ORDER BY criado_em DESC', [req.tenantId]);
  res.json(rows);
});
router.post('/', async (req, res) => {
  const f = req.body;
  const { rows } = await query(
    `INSERT INTO pdis (tenant_id,colaborador_id,col_nome,objetivo,competencias,acoes,revisoes,proxima_revisao,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [req.tenantId,f.colaborador_id||null,f.col_nome||'',f.objetivo||'',
     JSON.stringify(f.competencias||[]),JSON.stringify(f.acoes||[]),JSON.stringify(f.revisoes||[]),
     f.proxima_revisao||null,f.status||'Em andamento']
  );
  res.status(201).json(rows[0]);
});
router.put('/:id', async (req, res) => {
  const f = req.body;
  const { rows } = await query(
    `UPDATE pdis SET objetivo=$1,competencias=$2,acoes=$3,revisoes=$4,proxima_revisao=$5,status=$6
     WHERE id=$7 AND tenant_id=$8 RETURNING *`,
    [f.objetivo||'',JSON.stringify(f.competencias||[]),JSON.stringify(f.acoes||[]),
     JSON.stringify(f.revisoes||[]),f.proxima_revisao||null,f.status||'Em andamento',
     req.params.id,req.tenantId]
  );
  res.json(rows[0]);
});
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM pdis WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});
module.exports = router;
