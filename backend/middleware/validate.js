// Middleware de validação com Zod.
// Uso: router.post('/path', validate(schema), handler)
// Se o body não bater com o schema, retorna 400 com lista de erros.
// Se bater, req.body é substituído pelo objeto parseado (sanitizado).

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: result.error.issues.map(i => ({
        campo: i.path.join('.'),
        mensagem: i.message,
      })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = validate;
