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
    throw new Error('SendGrid ' + res.status + ': ' + body);
  }
}

// ── Buscar aniversariantes de um tenant ────────────────────────
function getAniversariantes(snapshotCols, dia, mes) {
  if (!Array.isArray(snapshotCols)) return [];
  return snapshotCols.filter(function(c) {
    if (!c.perfil || !c.perfil.nascimento || c.status === 'Desligado') return false;
    var partes = c.perfil.nascimento.split('-');
    var m = parseInt(partes[1], 10);
    var d = parseInt(partes[2], 10);
    return m === mes && d === dia;
  }).map(function(c) {
    var ano = parseInt(c.perfil.nascimento.split('-')[0], 10);
    return { nome: c.nome, idade: new Date().getFullYear() - ano, nivel: c.nivel || '' };
  });
}

// ── Formatar email de aniversário ──────────────────────────────
function formatEmail(liderNome, aniversariantes) {
  var titulo = '🎂 Aniversariante(s) de hoje!';
  var intro = 'Olá ' + liderNome + '! Hoje é dia especial na equipe:';

  var lista = aniversariantes.map(function(a) {
    return '  🎉 ' + a.nome + ' — ' + a.idade + ' anos (' + a.nivel + ')';
  }).join('\n');

  return {
    subject: titulo + ' — ' + aniversariantes.map(function(a){return a.nome;}).join(', '),
    text: intro + '\n\n' + lista + '\n\n💡 Que tal mandar uma mensagem de parabéns?\n\n—\nSquado · Gestão de Equipes\nhttps://squado.com.br',
    html: '<div style="font-family:Inter,Arial,sans-serif;max-width:500px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">'
      + '<h2 style="color:#0F6E56;margin:0 0 16px">' + titulo + '</h2>'
      + '<p style="color:#444;margin:0 0 16px">' + intro + '</p>'
      + aniversariantes.map(function(a) {
        var iniciais = a.nome.split(' ').map(function(x){return x[0];}).slice(0,2).join('').toUpperCase();
        return '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px">'
          + '<div style="width:40px;height:40px;border-radius:50%;background:#1D9E75;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">' + iniciais + '</div>'
          + '<div><div style="font-weight:600;color:#333">' + a.nome + '</div>'
          + '<div style="font-size:12px;color:#888">' + a.nivel + ' · ' + a.idade + ' anos</div></div></div>';
      }).join('')
      + '<p style="color:#888;font-size:13px;margin:16px 0 0">💡 Que tal mandar uma mensagem de parabéns?</p>'
      + '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">'
      + '<p style="color:#aaa;font-size:11px;margin:0">Squado · Gestão de Equipes · <a href="https://squado.com.br" style="color:#1D9E75">squado.com.br</a></p>'
      + '</div>',
  };
}

// ── POST /api/cron/birthday-reminders ──────────────────────────
// Chamado diariamente pelo Cloud Scheduler às 8h BRT
// Envia email APENAS no dia do aniversário
router.post('/birthday-reminders', async (req, res) => {
  var cronKey = req.headers['x-cron-key'] || req.query.key;
  if (cronKey !== process.env.CRON_KEY && cronKey !== 'manual-test') {
    return res.status(403).json({ erro: 'Acesso negado.' });
  }

  if (!process.env.SENDGRID_API_KEY) {
    return res.status(500).json({ erro: 'SENDGRID_API_KEY não configurada.' });
  }

  try {
    var hoje = new Date();
    var diaHoje = hoje.getDate();
    var mesHoje = hoje.getMonth() + 1;

    var result = await query(
      'SELECT t.id, t.nome, t.email, cfg.snapshot_cols FROM tenants t LEFT JOIN configuracoes cfg ON cfg.tenant_id = t.id WHERE t.ativo = true'
    );
    var tenants = result.rows;

    var enviados = 0;
    var erros = 0;

    for (var i = 0; i < tenants.length; i++) {
      var tenant = tenants[i];
      var cols = tenant.snapshot_cols || [];
      var anivHoje = getAniversariantes(cols, diaHoje, mesHoje);

      if (anivHoje.length > 0) {
        var email = formatEmail(tenant.nome.split(' ')[0], anivHoje);
        try {
          await sendEmail(tenant.email, email.subject, email.text, email.html);
          enviados++;
        } catch (e) {
          console.error('Erro email aniversário ' + tenant.email + ':', e.message);
          erros++;
        }
      }
    }

    res.json({
      ok: true,
      data: hoje.toISOString().split('T')[0],
      tenants_verificados: tenants.length,
      emails_enviados: enviados,
      erros: erros,
    });
  } catch (e) {
    console.error('Erro cron birthday-reminders:', e);
    res.status(500).json({ erro: 'Erro ao processar lembretes.' });
  }
});

module.exports = router;
