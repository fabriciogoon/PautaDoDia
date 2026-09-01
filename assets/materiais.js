// assets/materiais.js — lista de materiais + (só ADM) criar material.
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

async function iniciar() {
  const lista = document.getElementById('lista-posts');
  if (!window.PDDApi || !PDDApi.ok()) { lista.innerHTML = '<p class="muted">Configure o Supabase pra ativar os materiais (veja SUPABASE-SETUP.md).</p>'; return; }
  await areaAdmin();
  const posts = await PDDApi.posts();
  lista.innerHTML = '';
  if (!posts.length) { lista.appendChild(el('div', 'state', 'Nenhum material publicado ainda.')); return; }
  posts.forEach((p) => {
    const card = el('a', 'material-card');
    card.href = `./post.html?id=${encodeURIComponent(p.id)}`;
    const data = new Date(p.created_at).toLocaleDateString('pt-BR');
    const resumo = (p.conteudo || '').slice(0, 160);
    card.innerHTML = `<div class="material-meta">${PDDApi.esc(p.autor || 'ADM')} · ${data}</div>
      <h2 class="material-tit">${PDDApi.esc(p.titulo)}</h2>
      <p class="material-resumo">${PDDApi.esc(resumo)}${p.conteudo.length > 160 ? '…' : ''}</p>
      <span class="pauta-cta">ler e comentar →</span>`;
    lista.appendChild(card);
  });
}

async function areaAdmin() {
  const area = document.getElementById('admin-area'); area.innerHTML = '';
  const admin = await PDDApi.isAdmin();
  if (!admin) return;
  const u = await PDDApi.user();
  const box = el('div', 'admin-box');
  box.innerHTML = `<div class="admin-badge">modo administrador</div>
    <input id="pt-tit" class="admin-input" type="text" placeholder="Título do material">
    <textarea id="pt-con" class="admin-input" rows="6" placeholder="Escreva seu texto/matéria aqui…"></textarea>`;
  const pub = el('button', 'auth-btn', 'Publicar material');
  pub.onclick = async () => {
    const titulo = box.querySelector('#pt-tit').value.trim();
    const conteudo = box.querySelector('#pt-con').value.trim();
    if (!titulo || !conteudo) return;
    const { error } = await PDDApi.addPost(titulo, conteudo, PDDApi.nomeDe(u));
    if (error) { alert('Não consegui publicar: ' + error.message); return; }
    iniciar();
  };
  box.appendChild(pub);
  area.appendChild(box);
}

document.addEventListener('DOMContentLoaded', iniciar);
