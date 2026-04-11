const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM metas WHERE tenant_id=$1 ORDER BY criado_em DESC', [req.tenantId]);
  res.json(rows);
});
router.post('/', async (req, res) => {
  const f = req.body;
  const { rows } = await query(
    `INSERT INTO metas (tenant_id,colaborador_id,tipo,titulo,objetivo,area,periodo,key_results,status,progresso,prazo,colaborador,especifica,mensuravel,atingivel,relevante,temporal)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [req.tenantId,f.colaborador_id||null,f.tipo,f.titulo||'',f.objetivo||'',f.area||'',f.periodo||'',
     JSON.stringify(f.key_results||[]),f.status||'Pendente',f.progresso||0,f.prazo||null,
     f.colaborador||'',f.especifica||'',f.mensuravel||'',f.atingivel||'',f.relevante||'',f.temporal||'']
  );
  res.status(201).json(rows[0]);
});
router.put('/:id', async (req, res) => {
  const f = req.body;
  const { rows } = await query(
    `UPDATE metas SET titulo=$1,objetivo=$2,area=$3,periodo=$4,key_results=$5,status=$6,progresso=$7,prazo=$8,especifica=$9,mensuravel=$10,atingivel=$11,relevante=$12,temporal=$13
     WHERE id=$14 AND tenant_id=$15 RETURNING *`,
    [f.titulo||'',f.objetivo||'',f.area||'',f.periodo||'',JSON.stringify(f.key_results||[]),
     f.status||'Pendente',f.progresso||0,f.prazo||null,f.especifica||'',f.mensuravel||'',
     f.atingivel||'',f.relevante||'',f.temporal||'',req.params.id,req.tenantId]
  );
  res.json(rows[0]);
});
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM metas WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});
module.exports = router;
