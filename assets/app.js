// assets/app.js — home: Central (leitura do momento) + mural de notícias clicáveis.
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = (s) => (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const estado = { feed: null, central: null, nicho: 'todos', busca: '' };

async function carregar() {
  try {
    const [rf, rc] = await Promise.all([
      fetch(`./data/feed.json?v=${Date.now()}`),
      fetch(`./data/central.json?v=${Date.now()}`).catch(() => null),
    ]);
    if (!rf.ok) throw new Error('sem feed');
    estado.feed = await rf.json();
    if (rc && rc.ok) { try { estado.central = await rc.json(); } catch {} }
    render();
  } catch {
    $('#mural').innerHTML = '';
    $('#mural').appendChild(el('div', 'state', 'Ainda não há edição publicada.<br>Rode <code>node scripts/gerar.mjs</code> para gerar a primeira.'));
  }
}

function faz(iso) {
  const d = new Date(iso), min = Math.round((Date.now() - d) / 60000);
  if (isNaN(min)) return '';
  if (min < 1) return 'agora'; if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60); if (h < 24) return `há ${h}h`;
  const dias = Math.round(h / 24); return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

/* ── Central ──────────────────────────────────────────────── */
function renderCentral() {
  const box = $('#central');
  if (!estado.central || !estado.central.blocos) { box.style.display = 'none'; return; }
  box.style.display = '';
  box.innerHTML = '';
  const inner = el('div', 'central-inner');
  const head = el('div', 'central-head');
  head.appendChild(el('div', 'central-kicker', 'Central'));
  head.appendChild(el('h2', 'central-title', esc(estado.central.titulo || 'Leitura do momento')));
  if (estado.central.subtitulo) head.appendChild(el('p', 'central-sub', esc(estado.central.subtitulo)));
  inner.appendChild(head);

  const grid = el('div', 'central-grid');
  const ICON = { 'Em alta': '📈', 'Pode funcionar': '✅', 'Evite': '⚠️', 'Fique de olho': '👀' };
  for (const b of estado.central.blocos) {
    const card = el('div', 'central-card');
    card.appendChild(el('div', 'central-card-h', `${ICON[b.tipo] || '•'} <span>${esc(b.tipo)}</span>`));
    const ul = el('ul', 'central-list');
    (b.itens || []).forEach((i) => ul.appendChild(el('li', null, esc(i))));
    card.appendChild(ul);
    grid.appendChild(card);
  }
  inner.appendChild(grid);
  box.appendChild(inner);
}

/* ── Temas (aba) ──────────────────────────────────────────── */
function contarNichos() { const c = {}; for (const p of estado.feed.pautas) for (const id of (p.segmentos || [])) c[id] = (c[id] || 0) + 1; return c; }
function renderNichos() {
  const nav = $('#nichos'); nav.innerHTML = '';
  const c = contarNichos(), cat = estado.feed.segmentos || [], total = estado.feed.pautas.length;
  const item = (id, e, nome, n) => {
    const b = el('button', 'niche' + (estado.nicho === id ? ' active' : ''));
    b.innerHTML = `<span class="niche-emoji">${e}</span><span class="niche-name">${esc(nome)}</span><span class="niche-count">${n}</span>`;
    b.onclick = () => { estado.nicho = id; render(); };
    return b;
  };
  nav.appendChild(item('todos', '🗞️', 'Todos os temas', total));
  cat.map((s) => ({ ...s, n: c[s.id] || 0 })).filter((s) => s.n > 0)
    .sort((a, b) => b.n - a.n || a.nome.localeCompare(b.nome))
    .forEach((s) => nav.appendChild(item(s.id, s.emoji, s.nome, s.n)));
}

function filtrar() {
  const q = estado.busca.trim().toLowerCase();
  return estado.feed.pautas.filter((p) => {
    const okNicho = estado.nicho === 'todos' || (p.segmentos || []).includes(estado.nicho);
    const okBusca = !q || `${p.titulo} ${p.resumo || ''}`.toLowerCase().includes(q);
    return okNicho && okBusca;
  });
}

/* ── Card de notícia (clicável → pauta.html) ──────────────── */
function cardPauta(p, destaque) {
  const a = el('a', 'pauta' + (destaque ? ' featured' : ''));
  a.href = `pauta.html?id=${encodeURIComponent(p.id)}`;
  const meta = el('div', 'pauta-meta');
  meta.appendChild(el('span', 'cat', esc(p.categoria)));
  meta.appendChild(el('span', null, esc(p.fonte)));
  meta.appendChild(el('span', 'dot', '•'));
  meta.appendChild(el('span', null, faz(p.publicado_em)));
  a.appendChild(meta);
  a.appendChild(el('h2', 'pauta-title', esc(p.titulo)));
  if (p.resumo) a.appendChild(el('p', 'pauta-summary', esc(p.resumo)));
  a.appendChild(el('span', 'pauta-cta', `${p.ideias.length} ideias de conteúdo →`));
  return a;
}

function render() {
  const f = estado.feed;
  $('#edicao').textContent = f.edicao || '—';
  $('#atualizado').textContent = f.gerado_em ? `atualizado ${faz(f.gerado_em)}` : '';
  renderCentral();
  renderNichos();
  $('#tituloNicho').textContent = estado.nicho === 'todos' ? 'Todos os temas' : (f.segmentos.find((s) => s.id === estado.nicho)?.nome || 'Tema');
  const pautas = filtrar();
  $('#contador').textContent = `${pautas.length} ${pautas.length === 1 ? 'pauta' : 'pautas'}`;
  const mural = $('#mural'); mural.innerHTML = '';
  if (!pautas.length) { mural.appendChild(el('div', 'state', 'Nenhuma pauta com esse filtro.<br>Tente outro tema ou limpe a busca.')); return; }
  pautas.forEach((p, i) => mural.appendChild(cardPauta(p, i === 0 && estado.nicho === 'todos' && !estado.busca)));
}

$('#busca').addEventListener('input', (e) => { estado.busca = e.target.value; render(); });
carregar();
