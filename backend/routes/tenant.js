const router = require('express').Router();
const { query } = require('../db');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

router.get('/', async (req, res) => {
  res.json(req.tenant);
});
router.put('/', validate(schemas.tenantUpdate), async (req, res) => {
  const { nome, empresa, segmento, qtd_amostras, cor_primaria } = req.body;
  const { rows } = await query(
    'UPDATE tenants SET nome=$1,empresa=$2,segmento=$3,qtd_amostras=$4,cor_primaria=$5 WHERE id=$6 RETURNING id,nome,email,empresa,segmento,plano,qtd_amostras',
    [nome,empresa||'',segmento||'',qtd_amostras||500,cor_primaria||'#0F6E56',req.tenantId]
  );
  res.json(rows[0]);
});
module.exports = router;
