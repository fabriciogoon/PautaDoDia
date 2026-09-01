// assets/post.js — lê um material do ADM + comentários.
const el = (t, c, h) => { const n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };

async function iniciar() {
  const corpo = document.getElementById('corpo');
  if (!window.PDDApi || !PDDApi.ok()) { corpo.innerHTML = '<p class="muted">Configure o Supabase (veja SUPABASE-SETUP.md).</p>'; return; }
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { corpo.innerHTML = '<div class="state">Material não encontrado.</div>'; return; }
  const p = await PDDApi.post(id);
  if (!p) { corpo.innerHTML = '<div class="state">Esse material não existe mais.</div>'; return; }
  document.title = `${p.titulo} — Pauta do Dia`;
  const data = new Date(p.created_at).toLocaleDateString('pt-BR');
  corpo.appendChild(el('div', 'detalhe-kicker', `${PDDApi.esc(p.autor || 'ADM')} · ${data}`));
  corpo.appendChild(el('h1', 'detalhe-title', PDDApi.esc(p.titulo)));
  const txt = el('div', 'material-corpo');
  (p.conteudo || '').split(/\n{2,}/).forEach((par) => txt.appendChild(el('p', null, PDDApi.esc(par).replace(/\n/g, '<br>'))));
  corpo.appendChild(txt);

  // ADM pode apagar
  if (await PDDApi.isAdmin()) {
    const del = el('button', 'mini-del', 'apagar material');
    del.onclick = async () => { if (confirm('Apagar este material?')) { await PDDApi.delPost(id); location.href = './materiais.html'; } };
    corpo.appendChild(del);
  }
  PDDApi.montarComentarios(document.getElementById('comentarios'), 'post', id);
}

document.addEventListener('DOMContentLoaded', iniciar);
