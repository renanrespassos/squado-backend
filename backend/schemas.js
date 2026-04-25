const z = require('zod');

// ── Error map global PT-BR ──────────────────────────────────────
z.setErrorMap((issue, ctx) => {
  const msgs = {
    invalid_type: `Esperado ${issue.expected}, recebido ${issue.received}.`,
    too_small: `Mínimo ${issue.minimum} caractere${issue.minimum!==1?'s':''}.`,
    too_big: `Máximo ${issue.maximum} caractere${issue.maximum!==1?'s':''}.`,
    invalid_string: issue.validation === 'email' ? 'Email inválido.' : issue.validation === 'uuid' ? 'ID inválido.' : 'Formato inválido.',
    invalid_enum_value: `Valor inválido. Opções: ${issue.options?.join(', ')}.`,
  };
  return { message: msgs[issue.code] || ctx.defaultError };
});

// ── Helpers ──────────────────────────────────────────────────────
const str = z.string().trim();
const optStr = str.optional().default('');

// ── Auth ─────────────────────────────────────────────────────────
exports.registro = z.object({
  nome: str.min(1, 'Nome obrigatório.'),
  email: str.email('Email inválido.'),
  senha: str.min(8, 'Senha deve ter pelo menos 8 caracteres.'),
  empresa: optStr,
  segmento: optStr,
}).strip();

exports.login = z.object({
  email: str.min(1, 'Email obrigatório.'),
  senha: str.min(1, 'Senha obrigatória.'),
}).strip();

exports.trocarSenha = z.object({
  senhaAtual: str.min(1, 'Senha atual obrigatória.'),
  novaSenha: str.min(8, 'Nova senha deve ter pelo menos 8 caracteres.'),
}).strip();

// ── Nine-Box ─────────────────────────────────────────────────────
exports.nineboxCreate = z.object({
  colaborador_id: z.string().uuid('colaborador_id deve ser UUID válido.'),
  desempenho: z.coerce.number().int().min(1, 'Desempenho mínimo é 1.').max(3, 'Desempenho máximo é 3.'),
  potencial: z.coerce.number().int().min(1, 'Potencial mínimo é 1.').max(3, 'Potencial máximo é 3.'),
}).strict();

// ── Tenant ───────────────────────────────────────────────────────
exports.tenantUpdate = z.object({
  nome: str.min(1, 'Nome obrigatório.').optional(),
  empresa: optStr,
  segmento: optStr,
  qtd_amostras: z.coerce.number().int().min(0, 'Quantidade não pode ser negativa.').optional().default(500),
  cor_primaria: str.regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex (#RRGGBB).').optional().default('#0F6E56'),
}).strip();

// ── Admin ────────────────────────────────────────────────────────
exports.adminExtendTrial = z.object({
  days: z.coerce.number().int().min(1, 'Mínimo 1 dia.').max(365, 'Máximo 365 dias.'),
}).strict();

exports.adminPlano = z.object({
  plano: z.enum(['trial', 'standard', 'pro'], { errorMap: () => ({ message: 'Plano inválido. Use: trial, standard, pro.' }) }),
}).strict();

exports.adminAtivo = z.object({
  ativo: z.boolean({ invalid_type_error: 'ativo deve ser boolean.' }),
}).strict();

// ── Colaboradores ────────────────────────────────────────────────
const colaboradorBase = {
  nome: str.min(1, 'Nome obrigatório.'),
  nivel: optStr,
  area: optStr,
  status: optStr.default('Ativo'),
  email: optStr,
  celular: optStr,
  nascimento: z.string().nullable().optional(),
  cpf: optStr,
  endereco: optStr,
  formacao: optStr,
  conhecimentos: optStr,
  obs: optStr,
  historico: z.array(z.any()).optional().default([]),
};
exports.colaboradorCreate = z.object(colaboradorBase).strip();
exports.colaboradorUpdate = z.object(colaboradorBase).strip();

// ── Metas ────────────────────────────────────────────────────────
exports.metaCreate = z.object({
  colaborador_id: z.string().nullable().optional(),
  tipo: z.enum(['okr', 'smart']).optional(),
  titulo: optStr,
  objetivo: optStr,
  area: optStr,
  periodo: optStr,
  key_results: z.array(z.any()).optional().default([]),
  status: optStr.default('Pendente'),
  progresso: z.coerce.number().min(0, 'Progresso mínimo é 0.').max(100, 'Progresso máximo é 100.').optional().default(0),
  prazo: z.string().nullable().optional(),
  colaborador: optStr,
  especifica: optStr,
  mensuravel: optStr,
  atingivel: optStr,
  relevante: optStr,
  temporal: optStr,
}).strip();

exports.metaUpdate = exports.metaCreate;

// ── PDIs ─────────────────────────────────────────────────────────
exports.pdiCreate = z.object({
  colaborador_id: z.string().nullable().optional(),
  col_nome: optStr,
  objetivo: optStr,
  competencias: z.array(z.any()).optional().default([]),
  acoes: z.array(z.any()).optional().default([]),
  revisoes: z.array(z.any()).optional().default([]),
  status: optStr.default('Em andamento'),
}).strip();

exports.pdiUpdate = z.object({
  objetivo: optStr,
  competencias: z.array(z.any()).optional().default([]),
  acoes: z.array(z.any()).optional().default([]),
  revisoes: z.array(z.any()).optional().default([]),
  status: optStr.default('Em andamento'),
}).strip();

// ── Config (snapshot) ────────────────────────────────────────────
// Whitelist dos 22 campos aceitos. Campos extras são removidos (.strip).
// Cada campo é JSONB genérico — proteção aqui é a whitelist, não o shape.
const jf = z.any().optional();
exports.configUpdate = z.object({
  valores: jf, matriz_comp: jf, perguntas: jf, niveis: jf,
  organograma_pos: jf, organograma_conn: jf, gestor_config: jf, ninebox: jf,
  historico_ia: jf,
  last_save: z.number().nullable().optional(),
  snapshot_cols: jf, snapshot_avaliacoes: jf, snapshot_metas: jf, snapshot_notas: jf,
  snapshot_pdis: jf, snapshot_funcoes: jf, snapshot_areas: jf, snapshot_ninebox: jf,
  snapshot_valores_empresa: jf, snapshot_competencias: jf, snapshot_niveis: jf,
  snapshot_perguntas: jf,
}).strip();
