const router = require('express').Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM configuracoes WHERE tenant_id=$1', [req.tenantId]);
  res.json(rows[0] || {});
});
router.put('/', async (req, res) => {
  const { valores, matriz_comp, perguntas, niveis, organograma_pos, organograma_conn, gestor_config, ninebox } = req.body;
  const { rows } = await query(
    `INSERT INTO configuracoes (tenant_id,valores,matriz_comp,perguntas,niveis,organograma_pos,organograma_conn,gestor_config)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (tenant_id) DO UPDATE SET
       valores=COALESCE($2,configuracoes.valores),
       matriz_comp=COALESCE($3,configuracoes.matriz_comp),
       perguntas=COALESCE($4,configuracoes.perguntas),
       niveis=COALESCE($5,configuracoes.niveis),
       organograma_pos=COALESCE($6,configuracoes.organograma_pos),
       organograma_conn=COALESCE($7,configuracoes.organograma_conn),
       gestor_config=COALESCE($8,configuracoes.gestor_config),
       atualizado_em=NOW()
     RETURNING *`,
    [req.tenantId,
     valores ? JSON.stringify(valores) : null,
     matriz_comp ? JSON.stringify(matriz_comp) : null,
     perguntas ? JSON.stringify(perguntas) : null,
     niveis ? JSON.stringify(niveis) : null,
     organograma_pos ? JSON.stringify(organograma_pos) : null,
     organograma_conn ? JSON.stringify(organograma_conn) : null,
     gestor_config ? JSON.stringify(gestor_config) : null]
  );
  res.json(rows[0]);
});
module.exports = router;
