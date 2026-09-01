// assets/pauta.js — página de uma notícia: cada ideia já vira um prompt pra IA.
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
const esc = (s) => (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1600); }
async function copiar(txt, btn) {
  const done = () => { if (btn) { btn.classList.add('done'); const o = btn.textContent; btn.textContent = 'copiado ✓'; setTimeout(() => { btn.classList.remove('done'); btn.textContent = o; }, 1400); } toast('Prompt copiado'); };
  try { await navigator.clipboard.writeText(txt); done(); } catch { done(); }
}
function faz(iso) {
  const d = new Date(iso), min = Math.round((Date.now() - d) / 60000);
  if (isNaN(min)) return ''; if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60); if (h < 24) return `há ${h}h`;
  const dias = Math.round(h / 24); return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

function idDaURL() { return new URLSearchParams(location.search).get('id'); }

async function carregar() {
  const id = idDaURL(), corpo = $('#corpo');
  if (!id) { corpo.appendChild(el('div', 'state', 'Nenhuma pauta selecionada.')); return; }
  let feed;
  try { feed = await (await fetch(`./data/feed.json?v=${Date.now()}`)).json(); }
  catch { corpo.appendChild(el('div', 'state', 'Não consegui carregar as pautas.')); return; }
  const p = feed.pautas.find((x) => x.id === id);
  if (!p) { corpo.appendChild(el('div', 'state', 'Essa pauta não está mais na edição de hoje.<br><a href="./index.html">Voltar pro mural</a>')); return; }
  render(p);
}

function render(p) {
  document.title = `${p.titulo} — Pauta do Dia`;
  const corpo = $('#corpo');

  const meta = el('div', 'pauta-meta');
  meta.appendChild(el('span', 'cat', esc(p.categoria)));
  meta.appendChild(el('span', null, esc(p.fonte)));
  meta.appendChild(el('span', 'dot', '•'));
  meta.appendChild(el('span', null, faz(p.publicado_em)));
  corpo.appendChild(meta);

  corpo.appendChild(el('h1', 'detalhe-title', esc(p.titulo)));
  if (p.resumo) corpo.appendChild(el('p', 'detalhe-sum', esc(p.resumo)));
  const link = el('a', 'source-link', `ver matéria completa no ${esc(p.fonte)} ↗`);
  link.href = p.url; link.target = '_blank'; link.rel = 'noreferrer';
  corpo.appendChild(link);

  // botão de favoritar (precisa de conta)
  if (window.PDDApi && PDDApi.ok()) {
    const favWrap = el('div', 'fav-wrap');
    corpo.appendChild(favWrap);
    PDDApi.montarFavorito(favWrap, p);
  }

  corpo.appendChild(el('div', 'detalhe-kicker', `${p.ideias.length} ideias de conteúdo — copie o prompt e cole na sua IA`));

  const lista = el('div', 'ideias-detalhe');
  p.ideias.forEach((idea, i) => lista.appendChild(cardIdeia(p, idea, i)));
  corpo.appendChild(lista);

  // comentários da notícia
  if (window.PDDApi && PDDApi.ok()) {
    PDDApi.montarComentarios(document.getElementById('comentarios'), 'pauta', p.id);
  }
}

function cardIdeia(p, idea, i) {
  const box = el('article', 'ideia-det');
  const tags = el('div', 'ideia-tags');
  tags.appendChild(el('span', 'tag', esc(idea.formato)));
  tags.appendChild(el('span', 'tag alt', esc(idea.objetivo)));
  box.appendChild(tags);

  box.appendChild(el('div', 'ideia-persp-label', 'Perspectiva'));
  box.appendChild(el('p', 'ideia-persp', esc(idea.perspectiva)));

  box.appendChild(el('div', 'ideia-persp-label', 'Prompt pra IA'));
  const pre = el('pre', 'prompt-box'); pre.textContent = idea.prompt;
  box.appendChild(pre);

  const acts = el('div', 'prompt-acts');
  const bcopy = el('button', 'btn-primary', 'copiar prompt');
  bcopy.onclick = () => copiar(idea.prompt, bcopy);
  acts.appendChild(bcopy);

  const q = encodeURIComponent(idea.prompt);
  const gpt = el('a', 'btn-ghost', 'abrir no ChatGPT ↗'); gpt.href = `https://chatgpt.com/?q=${q}`; gpt.target = '_blank'; gpt.rel = 'noreferrer';
  const cla = el('a', 'btn-ghost', 'abrir no Claude ↗'); cla.href = `https://claude.ai/new?q=${q}`; cla.target = '_blank'; cla.rel = 'noreferrer';
  acts.appendChild(gpt); acts.appendChild(cla);
  box.appendChild(acts);
  return box;
}

carregar();
