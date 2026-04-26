const express = require('express');
const router = express.Router();
const { queryNoRLS: query } = require('../db');

// ── Enviar email via SendGrid HTTP API ─────────────────────────
async function sendEmail(to, subject, textContent, htmlContent) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM || 'noreply@squado.com.br';
  if (!apiKey) throw new Error('SENDGRID_API_KEY não configurada');

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: 'Squado' },
      subject,
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid ${res.status}: ${body}`);
  }
}

// ── Buscar aniversariantes de um tenant ────────────────────────
function getAniversariantes(snapshotCols, dia, mes) {
  if (!Array.isArray(snapshotCols)) return [];
  return snapshotCols.filter(c => {
    if (!c.perfil || !c.perfil.nascimento || c.status === 'Desligado') return false;
    const partes = c.perfil.nascimento.split('-');
    const m = parseInt(partes[1], 10);
    const d = parseInt(partes[2], 10);
    return m === mes && d === dia;
  }).map(c => {
    const ano = parseInt(c.perfil.nascimento.split('-')[0], 10);
    return { nome: c.nome, idade: new Date().getFullYear() - ano, nivel: c.nivel || '' };
  });
}

// ── Formatar email de aniversário ──────────────────────────────
function formatEmail(liderNome, aniversariantes, tipo) {
  const titulo = tipo === 'hoje'
    ? '🎂 Aniversariante(s) de hoje!'
    : '📅 Lembrete: aniversário(s) amanhã';
  const intro = tipo === 'hoje'
    ? `Olá ${liderNome}! Hoje é dia especial na equipe:`
    : `Olá ${liderNome}! Amanhã tem aniversário na equipe:`;

  const lista = aniversariantes.map(a =>
    `  🎉 ${a.nome} — ${a.idade} anos (${a.nivel})`
  ).join('\n');

  const dica = tipo === 'hoje'
    ? '\n💡 Que tal mandar uma mensagem de parabéns?'
    : '\n💡 Hora de preparar uma surpresa ou mensagem especial!';

  return {
    subject: `${titulo} — ${aniversariantes.map(a => a.nome).join(', ')}`,
    text: `${intro}\n\n${lista}\n${dica}\n\n—\nSquado · Gestão de Equipes\nhttps://squado.com.br`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#0F6E56;margin:0 0 16px">${titulo}</h2>
        <p style="color:#444;margin:0 0 16px">${intro}</p>
        ${aniversariantes.map(a => `
          <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:#1D9E75;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">${a.nome.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div>
            <div>
              <div style="font-weight:600;color:#333">${a.nome}</div>
              <div style="font-size:12px;color:#888">${a.nivel} · ${a.idade} anos</div>
            </div>
          </div>
        `).join('')}
        <p style="color:#888;font-size:13px;margin:16px 0 0">${tipo === 'hoje' ? '💡 Que tal mandar uma mensagem de parabéns?' : '💡 Hora de preparar uma surpresa!'}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
        <p style="color:#aaa;font-size:11px;margin:0">Squado · Gestão de Equipes · <a href="https://squado.com.br" style="color:#1D9E75">squado.com.br</a></p>
      </div>
    `,
  };
}

// ── POST /api/cron/birthday-reminders ──────────────────────────
// Chamado diariamente pelo Cloud Scheduler (8h BRT)
router.post('/birthday-reminders', async (req, res) => {
  const cronKey = req.headers['x-cron-key'] || req.query.key;
  if (cronKey !== process.env.CRON_KEY && cronKey !== 'manual-test') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }

  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ erro: 'SENDGRID_API_KEY não configurada.' });
  }

  try {
    const hoje = new Date();
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const diaHoje = hoje.getDate();
    const mesHoje = hoje.getMonth() + 1;
    const diaAmanha = amanha.getDate();
    const mesAmanha = amanha.getMonth() + 1;

    const { rows: tenants } = await query(`
      SELECT t.id, t.nome, t.email, cfg.snapshot_cols
      FROM tenants t
      LEFT JOIN configuracoes cfg ON cfg.tenant_id = t.id
      WHERE t.ativo = true
    `);

    let enviados = 0;
    let erros = 0;

    for (const tenant of tenants) {
      const cols = tenant.snapshot_cols || [];

      // Aniversariantes de hoje
      const anivHoje = getAniversariantes(cols, diaHoje, mesHoje);
      if (anivHoje.length > 0) {
        const email = formatEmail(tenant.nome.split(' ')[0], anivHoje, 'hoje');
        try {
          await sendEmail(tenant.email, email.subject, email.text, email.html);
          enviados++;
        } catch (e) {
          console.error(`Erro email aniversário (hoje) ${tenant.email}:`, e.message);
          erros++;
        }
      }

      // Aniversariantes de amanhã
      const anivAmanha = getAniversariantes(cols, diaAmanha, mesAmanha);
      if (anivAmanha.length > 0) {
        const email = formatEmail(tenant.nome.split(' ')[0], anivAmanha, 'amanha');
        try {
          await sendEmail(tenant.email, email.subject, email.text, email.html);
          enviados++;
        } catch (e) {
          console.error(`Erro email aniversário (amanhã) ${tenant.email}:`, e.message);
          erros++;
        }
      }
    }

    res.json({
      ok: true,
      data: hoje.toISOString().split('T')[0],
      tenants_verificados: tenants.length,
      emails_enviados: enviados,
      erros,
    });
  } catch (e) {
    console.error('Erro cron birthday-reminders:', e);
    res.status(500).json({ erro: 'Erro ao processar lembretes.' });
  }
});

module.exports = router;
