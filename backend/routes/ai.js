const router = require('express').Router();

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';

// Rate limit simples em memória (por tenant)
const aiLimits = {};
const AI_MAX_PER_HOUR = parseInt(process.env.AI_RATE_LIMIT) || 30;

function checkAIRateLimit(tenantId) {
  const now = Date.now();
  if (!aiLimits[tenantId]) aiLimits[tenantId] = [];
  // Limpar entradas antigas (>1h)
  aiLimits[tenantId] = aiLimits[tenantId].filter(t => now - t < 3600000);
  if (aiLimits[tenantId].length >= AI_MAX_PER_HOUR) return false;
  aiLimits[tenantId].push(now);
  return true;
}

router.post('/chat', async (req, res) => {
  const { messages, max_tokens } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ erro: 'messages é obrigatório (array não vazio).' });
  }

  // Rate limit por tenant
  if (!checkAIRateLimit(req.tenantId)) {
    return res.status(429).json({ erro: 'Limite de chamadas IA atingido. Tente novamente em alguns minutos.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    req.log.error('GROQ_API_KEY não configurada');
    return res.status(503).json({ erro: 'Serviço de IA não configurado.' });
  }

  try {
    const groqResp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: messages.slice(-20), // Limitar contexto a 20 mensagens
        max_tokens: Math.min(max_tokens || 1000, 2000), // Cap em 2000 tokens
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!groqResp.ok) {
      const errBody = await groqResp.text();
      req.log.error({ status: groqResp.status, body: errBody.slice(0, 500) }, 'Groq API error');
      if (groqResp.status === 429) {
        return res.status(429).json({ erro: 'Limite da API de IA atingido. Tente em 1 minuto.' });
      }
      return res.status(502).json({ erro: 'Erro ao consultar IA.' });
    }

    const data = await groqResp.json();
    const content = data.choices?.[0]?.message?.content || '';

    res.json({
      content,
      model: data.model,
      usage: data.usage,
    });
  } catch (err) {
    req.log.error({ err: err.message }, 'AI proxy error');
    res.status(500).json({ erro: 'Erro interno ao processar IA.' });
  }
});

module.exports = router;
