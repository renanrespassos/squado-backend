const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM funcoes WHERE tenant_id=$1 ORDER BY area,nome', [req.tenantId]);
  res.json(rows);
});
router.post('/', async (req, res) => {
  const f = req.body;
  const { rows } = await query(
    'INSERT INTO funcoes (tenant_id,nome,area,tipo_tempo,tempo_min,pct_amostras,responsaveis) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.tenantId,f.nome,f.area||'',f.tipo_tempo||'por_amostra',f.tempo_min||10,f.pct_amostras||100,JSON.stringify(f.responsaveis||[])]
  );
  res.status(201).json(rows[0]);
});
router.put('/:id', async (req, res) => {
  const f = req.body;
  const { rows } = await query(
    'UPDATE funcoes SET nome=$1,area=$2,tipo_tempo=$3,tempo_min=$4,pct_amostras=$5,responsaveis=$6 WHERE id=$7 AND tenant_id=$8 RETURNING *',
    [f.nome,f.area||'',f.tipo_tempo||'por_amostra',f.tempo_min||10,f.pct_amostras||100,JSON.stringify(f.responsaveis||[]),req.params.id,req.tenantId]
  );
  res.json(rows[0]);
});
router.delete('/:id', async (req, res) => {
  await query('DELETE FROM funcoes WHERE id=$1 AND tenant_id=$2', [req.params.id, req.tenantId]);
  res.json({ mensagem: 'Excluído.' });
});
module.exports = router;
