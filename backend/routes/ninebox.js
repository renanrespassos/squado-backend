const router = require('express').Router();
const { query } = require('../db');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM ninebox WHERE tenant_id=$1', [req.tenantId]);
  res.json(rows);
});
router.post('/', validate(schemas.nineboxCreate), async (req, res) => {
  const { colaborador_id, desempenho, potencial } = req.body;
  const { rows } = await query(
    `INSERT INTO ninebox (tenant_id,colaborador_id,desempenho,potencial)
     VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id,colaborador_id)
     DO UPDATE SET desempenho=$3,potencial=$4,data_avaliacao=CURRENT_DATE RETURNING *`,
    [req.tenantId, colaborador_id, desempenho, potencial]
  );
  res.json(rows[0]);
});
router.delete('/:colId', async (req, res) => {
  await query('DELETE FROM ninebox WHERE colaborador_id=$1 AND tenant_id=$2', [req.params.colId, req.tenantId]);
  res.json({ mensagem: 'Removido.' });
});
module.exports = router;
