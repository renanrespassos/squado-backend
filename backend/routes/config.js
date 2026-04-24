const router = require('express').Router();
const { query } = require('../db');
const validate = require('../middleware/validate');
const schemas  = require('../schemas');

router.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM configuracoes WHERE tenant_id=$1', [req.tenantId]);
  res.json(rows[0] || {});
});

router.put('/', validate(schemas.configUpdate), async (req, res) => {
  const {
    valores, matriz_comp, perguntas, niveis,
    organograma_pos, organograma_conn, gestor_config, ninebox,
    historico_ia, last_save,
    snapshot_cols, snapshot_avaliacoes, snapshot_metas, snapshot_notas,
    snapshot_pdis, snapshot_funcoes, snapshot_areas, snapshot_ninebox,
    snapshot_valores_empresa, snapshot_competencias, snapshot_niveis,
    snapshot_perguntas
  } = req.body;

  // Helper: serializa para JSONB ou retorna null para nao tocar no campo (COALESCE preserva)
  const j = v => (v === undefined || v === null) ? null : JSON.stringify(v);

  const { rows } = await query(
    `INSERT INTO configuracoes (
       tenant_id,
       valores, matriz_comp, perguntas, niveis,
       organograma_pos, organograma_conn, gestor_config,
       historico_ia, last_save,
       snapshot_cols, snapshot_avaliacoes, snapshot_metas, snapshot_notas,
       snapshot_pdis, snapshot_funcoes, snapshot_areas, snapshot_ninebox,
       snapshot_valores_empresa, snapshot_competencias, snapshot_niveis,
       snapshot_perguntas
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
     )
     ON CONFLICT (tenant_id) DO UPDATE SET
       valores                  = COALESCE($2,  configuracoes.valores),
       matriz_comp              = COALESCE($3,  configuracoes.matriz_comp),
       perguntas                = COALESCE($4,  configuracoes.perguntas),
       niveis                   = COALESCE($5,  configuracoes.niveis),
       organograma_pos          = COALESCE($6,  configuracoes.organograma_pos),
       organograma_conn         = COALESCE($7,  configuracoes.organograma_conn),
       gestor_config            = COALESCE($8,  configuracoes.gestor_config),
       historico_ia             = COALESCE($9,  configuracoes.historico_ia),
       last_save                = COALESCE($10, configuracoes.last_save),
       snapshot_cols            = COALESCE($11, configuracoes.snapshot_cols),
       snapshot_avaliacoes      = COALESCE($12, configuracoes.snapshot_avaliacoes),
       snapshot_metas           = COALESCE($13, configuracoes.snapshot_metas),
       snapshot_notas           = COALESCE($14, configuracoes.snapshot_notas),
       snapshot_pdis            = COALESCE($15, configuracoes.snapshot_pdis),
       snapshot_funcoes         = COALESCE($16, configuracoes.snapshot_funcoes),
       snapshot_areas           = COALESCE($17, configuracoes.snapshot_areas),
       snapshot_ninebox         = COALESCE($18, configuracoes.snapshot_ninebox),
       snapshot_valores_empresa = COALESCE($19, configuracoes.snapshot_valores_empresa),
       snapshot_competencias    = COALESCE($20, configuracoes.snapshot_competencias),
       snapshot_niveis          = COALESCE($21, configuracoes.snapshot_niveis),
       snapshot_perguntas       = COALESCE($22, configuracoes.snapshot_perguntas),
       atualizado_em            = NOW()
     RETURNING *`,
    [
      req.tenantId,
      j(valores), j(matriz_comp), j(perguntas), j(niveis),
      j(organograma_pos), j(organograma_conn), j(gestor_config),
      j(historico_ia), last_save || null,
      j(snapshot_cols), j(snapshot_avaliacoes), j(snapshot_metas), j(snapshot_notas),
      j(snapshot_pdis), j(snapshot_funcoes), j(snapshot_areas), j(snapshot_ninebox),
      j(snapshot_valores_empresa), j(snapshot_competencias), j(snapshot_niveis),
      j(snapshot_perguntas)
    ]
  );
  res.json(rows[0]);
});

module.exports = router;
