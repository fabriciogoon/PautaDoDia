// assets/meu-espaco.js — favoritos, anotações e plano de ação (precisa de conta).
const $ = (s, r = document) => r.querySelector(s);
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

async function iniciar() {
  const alvo = $('#conteudo');
  if (!window.PDDApi || !PDDApi.ok()) { alvo.innerHTML = '<p class="muted">Configure o Supabase pra ativar sua conta (veja SUPABASE-SETUP.md).</p>'; return; }
  const u = await PDDApi.user();
  if (!u) {
    alvo.innerHTML = '<div class="state">Entre na sua conta pra ver seus favoritos, anotações e plano.</div>';
    const b = el('button', 'auth-btn', 'Entrar / Criar conta'); b.style.margin = '0 auto'; b.style.display = 'block';
    b.onclick = () => PDDApi.abrirModal(); alvo.appendChild(b); return;
  }
  alvo.innerHTML = '';
  alvo.appendChild(await secaoFavoritos());
  alvo.appendChild(await secaoNotas());
  alvo.appendChild(await secaoPlano());
}

function secao(titulo) {
  const s = el('section', 'espaco-secao');
  s.appendChild(el('h2', 'espaco-h', titulo));
  return s;
}

async function secaoFavoritos() {
  const s = secao('★ Favoritos');
  const favs = await PDDApi.favs();
  if (!favs.length) { s.appendChild(el('p', 'muted', 'Você ainda não salvou nenhuma pauta. Abra uma notícia e toque em “salvar nos favoritos”.')); return s; }
  const wrap = el('div', 'fav-lista');
  favs.forEach((f) => {
    const card = el('div', 'fav-card');
    card.innerHTML = `<a class="fav-tit" href="./pauta.html?id=${encodeURIComponent(f.pauta_id)}">${PDDApi.esc(f.titulo || 'pauta')}</a>
      <span class="fav-fonte">${PDDApi.esc(f.fonte || '')}</span>`;
    const del = el('button', 'mini-del', 'remover');
    del.onclick = async () => { await PDDApi.delFav(f.pauta_id); iniciar(); };
    card.appendChild(del); wrap.appendChild(card);
  });
  s.appendChild(wrap); return s;
}

async function secaoNotas() {
  const s = secao('✎ Anotações');
  const form = el('div', 'add-linha');
  form.innerHTML = '<textarea id="nt" rows="2" placeholder="escreva uma anotação…"></textarea>';
  const add = el('button', 'auth-btn', 'anotar');
  add.onclick = async () => { const t = form.querySelector('#nt').value.trim(); if (!t) return; await PDDApi.addNote(t); iniciar(); };
  form.appendChild(add); s.appendChild(form);
  const notes = await PDDApi.notes();
  const wrap = el('div', 'nota-lista');
  notes.forEach((n) => {
    const card = el('div', 'nota-card');
    card.appendChild(el('p', null, PDDApi.esc(n.texto)));
    const del = el('button', 'mini-del', 'apagar');
    del.onclick = async () => { await PDDApi.delNote(n.id); iniciar(); };
    card.appendChild(del); wrap.appendChild(card);
  });
  s.appendChild(wrap); return s;
}

async function secaoPlano() {
  const s = secao('✓ Plano de ação');
  const form = el('div', 'add-linha');
  form.innerHTML = '<input id="pl" type="text" placeholder="ex: postar carrossel sobre rebranding na quinta">';
  const add = el('button', 'auth-btn', 'adicionar');
  add.onclick = async () => { const t = form.querySelector('#pl').value.trim(); if (!t) return; await PDDApi.addPlano(t); iniciar(); };
  form.appendChild(add); s.appendChild(form);
  const itens = await PDDApi.plano();
  const wrap = el('div', 'plano-lista');
  itens.forEach((it) => {
    const row = el('label', 'plano-item' + (it.feito ? ' feito' : ''));
    const chk = el('input'); chk.type = 'checkbox'; chk.checked = it.feito;
    chk.onchange = async () => { await PDDApi.togglePlano(it.id, chk.checked); iniciar(); };
    row.appendChild(chk); row.appendChild(el('span', 'plano-txt', PDDApi.esc(it.texto)));
    const del = el('button', 'mini-del', '✕');
    del.onclick = async (e) => { e.preventDefault(); await PDDApi.delPlano(it.id); iniciar(); };
    row.appendChild(del); wrap.appendChild(row);
  });
  s.appendChild(wrap); return s;
}

document.addEventListener('DOMContentLoaded', iniciar);
