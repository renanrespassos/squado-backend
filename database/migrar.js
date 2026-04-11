// ═══════════════════════════════════════════════════════════════
// SQUADO — Script de Migração localStorage → PostgreSQL
// Execute no browser console após fazer login no sistema novo
// ═══════════════════════════════════════════════════════════════

const SQUADO_API = 'http://localhost:3001/api';

async function migrarDados(token) {
  console.log('🚀 Iniciando migração de dados...\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let erros = 0;
  let sucesso = 0;

  // ── 1. Colaboradores ─────────────────────────────────────────
  console.log('👥 Migrando colaboradores...');
  const colaboradores = JSON.parse(localStorage.getItem('cols_v3') || '[]');
  const mapaIds = {}; // id antigo → id novo

  for (const col of colaboradores) {
    try {
      const res = await fetch(`${SQUADO_API}/colaboradores`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome:          col.nome,
          nivel:         col.nivel,
          area:          col.area,
          status:        col.status || 'Ativo',
          email:         col.email || '',
          celular:       col.celular || '',
          nascimento:    col.nascimento || null,
          cpf:           col.cpf || '',
          endereco:      col.endereco || '',
          formacao:      col.formacao || '',
          conhecimentos: col.conhecimentos || '',
          obs:           col.obs || '',
          historico:     col.historico || [],
        })
      });
      const novo = await res.json();
      mapaIds[col.id] = novo.id;
      sucesso++;
      console.log(`  ✅ ${col.nome}`);
    } catch (e) {
      erros++;
      console.error(`  ❌ ${col.nome}:`, e.message);
    }
  }

  // ── 2. Avaliações ─────────────────────────────────────────────
  console.log('\n📋 Migrando avaliações...');
  const avaliacoes = JSON.parse(localStorage.getItem('avaliacoes') || '[]');
  for (const av of avaliacoes) {
    try {
      await fetch(`${SQUADO_API}/avaliacoes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          colaborador_id: mapaIds[av.colaboradorId] || null,
          colaborador:    av.colaborador,
          nivel:          av.nivel,
          data:           av.data,
          avaliador:      av.avaliador || '',
          media_geral:    av.mediaGeral,
          secao_medias:   av.secaoMedias || {},
          respostas:      av.respostas || {},
          pontos_pos:     av.pontosPos || '',
          oportunidades:  av.oportunidades || '',
        })
      });
      sucesso++;
      console.log(`  ✅ ${av.colaborador} — ${av.data}`);
    } catch (e) {
      erros++;
      console.error(`  ❌ Avaliação ${av.colaborador}:`, e.message);
    }
  }

  // ── 3. Notas ──────────────────────────────────────────────────
  console.log('\n📝 Migrando notas...');
  const notas = JSON.parse(localStorage.getItem('notas') || '[]');
  for (const n of notas) {
    try {
      await fetch(`${SQUADO_API}/notas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          colaborador_id: mapaIds[n.colId] || null,
          col_nome:    n.colNome || 'Geral',
          texto:       n.texto,
          categoria:   n.categoria || 'Geral',
          sentimento:  n.sentimento || 'neutro',
          data_hora:   n.dataHora || new Date().toISOString(),
        })
      });
      sucesso++;
    } catch (e) {
      erros++;
    }
  }
  console.log(`  ✅ ${notas.length} notas migradas`);

  // ── 4. Metas ──────────────────────────────────────────────────
  console.log('\n🎯 Migrando metas...');
  const metas = JSON.parse(localStorage.getItem('metas_v2') || '[]');
  for (const m of metas) {
    try {
      await fetch(`${SQUADO_API}/metas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tipo:        m.tipo,
          titulo:      m.titulo || m.objetivo || '',
          objetivo:    m.objetivo || '',
          area:        m.area || '',
          periodo:     m.periodo || '',
          key_results: m.keyResults || [],
          status:      m.status || 'Pendente',
          progresso:   m.progresso || 0,
          prazo:       m.prazo || null,
          colaborador: m.colaborador || '',
          especifica:  m.especifica || '',
          mensuravel:  m.mensuravel || '',
          atingivel:   m.atingivel || '',
          relevante:   m.relevante || '',
          temporal:    m.temporal || '',
        })
      });
      sucesso++;
    } catch (e) {
      erros++;
    }
  }
  console.log(`  ✅ ${metas.length} metas migradas`);

  // ── 5. PDIs ───────────────────────────────────────────────────
  console.log('\n🚀 Migrando PDIs...');
  const pdis = JSON.parse(localStorage.getItem('pdis_v1') || '[]');
  for (const p of pdis) {
    try {
      await fetch(`${SQUADO_API}/pdis`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          colaborador_id: mapaIds[p.colId] || null,
          col_nome:       p.colNome || '',
          objetivo:       p.objetivo || '',
          competencias:   p.competencias || [],
          acoes:          p.acoes || [],
          revisoes:       p.revisoes || [],
          proxima_revisao: p.proximaRevisao || null,
          status:         p.status || 'Em andamento',
        })
      });
      sucesso++;
    } catch (e) {
      erros++;
    }
  }
  console.log(`  ✅ ${pdis.length} PDIs migrados`);

  // ── 6. Funções de capacidade ───────────────────────────────────
  console.log('\n⚡ Migrando funções de capacidade...');
  const funcoes = JSON.parse(localStorage.getItem('funcoes_v8') || '[]');
  for (const f of funcoes) {
    try {
      await fetch(`${SQUADO_API}/funcoes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nome:          f.nome,
          area:          f.area,
          tipo_tempo:    f.tipoTempo || 'por_amostra',
          tempo_min:     f.tempoMin || 10,
          pct_amostras:  f.pctAmostras || 100,
          responsaveis:  f.responsaveis || [],
        })
      });
      sucesso++;
    } catch (e) {
      erros++;
    }
  }
  console.log(`  ✅ ${funcoes.length} funções migradas`);

  // ── 7. Configurações ──────────────────────────────────────────
  console.log('\n⚙️ Migrando configurações...');
  try {
    await fetch(`${SQUADO_API}/config`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        valores:          JSON.parse(localStorage.getItem('valores_v1') || 'null'),
        matriz_comp:      JSON.parse(localStorage.getItem('matriz_comp_v1') || 'null'),
        gestor_config:    JSON.parse(localStorage.getItem('gestor_config_v1') || 'null'),
        organograma_pos:  JSON.parse(localStorage.getItem('orgPos_v2') || '{}'),
        organograma_conn: JSON.parse(localStorage.getItem('orgConns') || '[]'),
        ninebox:          JSON.parse(localStorage.getItem('ninebox_v1') || '{}'),
      })
    });
    sucesso++;
    console.log('  ✅ Configurações migradas');
  } catch (e) {
    erros++;
    console.error('  ❌ Erro nas configurações:', e.message);
  }

  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erros:   ${erros}`);
  console.log(`═══════════════════════════════════`);
  console.log('\n🎉 Migração concluída!');
  console.log('Agora você pode usar o Squado com banco de dados.');
}

// Uso:
// 1. Faça login em squado.com.br
// 2. Copie o token JWT
// 3. Execute no console do browser do sistema ANTIGO:
//    migrarDados('seu_token_jwt_aqui')

// Para uso direto no Node.js com token:
if (typeof module !== 'undefined') {
  const token = process.argv[2];
  if (token) {
    migrarDados(token);
  } else {
    console.log('Uso: node migrar.js SEU_TOKEN_JWT');
  }
}
