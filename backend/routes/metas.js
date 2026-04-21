const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM metas WHERE tenant_id=$1 ORDER BY criado_em DESC', [req.tenantId]);
  res.json(rows);
});
router.post('/', async (req, res) => {
  try {
    const f = req.body;
    const { rows } = await query(
      `INSERT INTO metas (tenant_id,colaborador_id,tipo,titulo,objetivo,area,periodo,key_results,status,progresso)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.tenantId,f.colaborador_id||null,f.tipo,f.titulo||'',f.objetivo||'',f.area||'',f.periodo||'',
       JSON.stringify(f.key_results||[]),f.status||'Pendente',f.progresso||0]
    );
    res.status(201).json(rows[0]);
  } catch(e) {
    console.error('Erro POST metas:', e.message);
    res.status(500).json({ erro: e.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const f = req.body;
    const { rows } = await query(
      `UPDATE metas SET titulo=$1,objetivo=$2,area=$3,periodo=$4,key_results=$5,status=$6,progresso=$7
       WHERE id=$8 AND tenant_id=$9 RETURNING *`,
      [f.titulo||'',f.objetivo||'',f.area||'',f.periodo||'',JSON.stringify(f.key_results||[]),
       f.status||'Pendente',f.progresso||0,req.params.id,req.tenantId]
    );
    res.json(rows[0]);
  } catch(e) {
    res.status(500).json({ erro: e.message });
  }
});
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM metas WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});
module.exports = router;
