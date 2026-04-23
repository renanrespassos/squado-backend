// Middleware para verificar se o usuario e admin
// Usa variavel de ambiente ADMIN_EMAILS (lista separada por virgula)
module.exports = (req, res, next) => {
  if (!req.tenant) {
    return res.status(401).json({ erro: 'Nao autenticado.' });
  }
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const userEmail = (req.tenant.email || '').toLowerCase();
  if (!adminEmails.includes(userEmail)) {
    return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
  }
  next();
};
