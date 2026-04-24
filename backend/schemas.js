const z = require('zod');

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
  desempenho: z.coerce.number().int().min(1).max(3),
  potencial: z.coerce.number().int().min(1).max(3),
}).strict();

// ── Tenant ───────────────────────────────────────────────────────
exports.tenantUpdate = z.object({
  nome: str.min(1).optional(),
  empresa: optStr,
  segmento: optStr,
  qtd_amostras: z.coerce.number().int().min(0).optional().default(500),
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
