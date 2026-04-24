const router = require('express').Router();
const { query } = require('../db');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM metas WHERE tenant_id=$1 ORDER BY criado_em DESC', [req.tenantId]);
  res.json(rows);
});
router.post('/', validate(schemas.metaCreate), async (req, res) => {
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
router.put('/:id', validate(schemas.metaUpdate), async (req, res) => {
  try {
    const f = req.body;
    const { rows } = await query(
      `UPDATE metas SET colaborador_id=$1,titulo=$2,objetivo=$3,area=$4,periodo=$5,key_results=$6,status=$7,progresso=$8
       WHERE id=$9 AND tenant_id=$10 RETURNING *`,
      [f.colaborador_id||null,f.titulo||'',f.objetivo||'',f.area||'',f.periodo||'',JSON.stringify(f.key_results||[]),
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
