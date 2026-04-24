const router = require('express').Router();
const { query } = require('../db');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM pdis WHERE tenant_id=$1 ORDER BY criado_em DESC', [req.tenantId]);
  res.json(rows);
});
router.post('/', validate(schemas.pdiCreate), async (req, res) => {
  try {
    const f = req.body;
    const { rows } = await query(
      `INSERT INTO pdis (tenant_id,colaborador_id,col_nome,objetivo,competencias,acoes,revisoes,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.tenantId,f.colaborador_id||null,f.col_nome||'',f.objetivo||'',
       JSON.stringify(f.competencias||[]),JSON.stringify(f.acoes||[]),JSON.stringify(f.revisoes||[]),
       f.status||'Em andamento']
    );
    res.status(201).json(rows[0]);
  } catch(e) {
    console.error('Erro POST pdis:', e.message);
    res.status(500).json({ erro: e.message });
  }
});
router.put('/:id', validate(schemas.pdiUpdate), async (req, res) => {
  try {
    const f = req.body;
    const { rows } = await query(
      `UPDATE pdis SET objetivo=$1,competencias=$2,acoes=$3,revisoes=$4,status=$5
       WHERE id=$6 AND tenant_id=$7 RETURNING *`,
      [f.objetivo||'',JSON.stringify(f.competencias||[]),JSON.stringify(f.acoes||[]),
       JSON.stringify(f.revisoes||[]),f.status||'Em andamento',req.params.id,req.tenantId]
    );
    res.json(rows[0]);
  } catch(e) {
    res.status(500).json({ erro: e.message });
  }
});
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM pdis WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});
module.exports = router;
