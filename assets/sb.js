// assets/sb.js — conexão com o Supabase + contas + favoritos/notas/plano/posts/comentários.
// Depende de: supabase-js (CDN) e config.js carregados antes deste arquivo.
(function () {
  const cfg = window.PDD || {};
  const pronto = window.supabase && cfg.url && cfg.anon
    && !cfg.url.includes('SEU-PROJETO') && !cfg.anon.includes('SUA-CHAVE');
  const sb = pronto ? window.supabase.createClient(cfg.url, cfg.anon) : null;

  const nomeDe = (u) => (u && (u.user_metadata?.nome || (u.email || '').split('@')[0])) || 'você';
  const esc = (s) => (s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const api = {
    ok: () => !!sb,
    async user() { if (!sb) return null; const { data } = await sb.auth.getUser(); return data.user; },
    async isAdmin() { if (!sb) return false; try { const { data } = await sb.rpc('is_admin'); return !!data; } catch { return false; } },
    onAuth(cb) { if (sb) sb.auth.onAuthStateChange((_e, s) => cb(s?.user || null)); },
    async signUp(email, pass, nome) { return sb.auth.signUp({ email, password: pass, options: { data: { nome } } }); },
    async signIn(email, pass) { return sb.auth.signInWithPassword({ email, password: pass }); },
    async signOut() { await sb.auth.signOut(); location.reload(); },

    // favoritos
    async favs() { const { data } = await sb.from('favoritos').select('*').order('created_at', { ascending: false }); return data || []; },
    async isFav(pautaId) { const { data } = await sb.from('favoritos').select('id').eq('pauta_id', pautaId).maybeSingle(); return !!data; },
    async addFav(p) { return sb.from('favoritos').insert({ pauta_id: p.id, titulo: p.titulo, url: p.url, fonte: p.fonte }); },
    async delFav(pautaId) { return sb.from('favoritos').delete().eq('pauta_id', pautaId); },

    // anotações
    async notes() { const { data } = await sb.from('anotacoes').select('*').order('created_at', { ascending: false }); return data || []; },
    async addNote(texto) { return sb.from('anotacoes').insert({ texto }); },
    async delNote(id) { return sb.from('anotacoes').delete().eq('id', id); },

    // plano de ação
    async plano() { const { data } = await sb.from('plano_itens').select('*').order('created_at', { ascending: true }); return data || []; },
    async addPlano(texto) { return sb.from('plano_itens').insert({ texto }); },
    async togglePlano(id, feito) { return sb.from('plano_itens').update({ feito }).eq('id', id); },
    async delPlano(id) { return sb.from('plano_itens').delete().eq('id', id); },

    // posts do ADM
    async posts() { const { data } = await sb.from('posts').select('*').order('created_at', { ascending: false }); return data || []; },
    async post(id) { const { data } = await sb.from('posts').select('*').eq('id', id).maybeSingle(); return data; },
    async addPost(titulo, conteudo, autor) { return sb.from('posts').insert({ titulo, conteudo, autor }); },
    async delPost(id) { return sb.from('posts').delete().eq('id', id); },

    // comentários
    async comentarios(tipo, id) { const { data } = await sb.from('comentarios').select('*').eq('alvo_tipo', tipo).eq('alvo_id', id).order('created_at', { ascending: true }); return data || []; },
    async addComentario(tipo, id, texto, autorNome) { return sb.from('comentarios').insert({ alvo_tipo: tipo, alvo_id: id, texto, autor_nome: autorNome }); },
    async delComentario(id) { return sb.from('comentarios').delete().eq('id', id); },

    nomeDe, esc,
  };
  window.PDDApi = api;

  /* ───────────────────── UI: barra de conta no cabeçalho ─────────────────── */
  async function montarAuthbar() {
    const bar = document.getElementById('authbar');
    if (!bar) return;
    if (!sb) { bar.innerHTML = '<span class="authbar-off">conta desativada — configure o Supabase</span>'; return; }
    const u = await api.user();
    if (u) {
      bar.innerHTML = `<span class="auth-oi">Olá, ${esc(nomeDe(u))}</span>
        <a class="auth-link" href="./meu-espaco.html">Meu Espaço</a>
        <button class="auth-btn ghost" id="auth-sair">sair</button>`;
      document.getElementById('auth-sair').onclick = () => api.signOut();
    } else {
      bar.innerHTML = `<button class="auth-btn" id="auth-entrar">Entrar / Criar conta</button>`;
      document.getElementById('auth-entrar').onclick = abrirModal;
    }
  }

  /* ───────────────────── UI: modal de login / cadastro ───────────────────── */
  function abrirModal() {
    let m = document.getElementById('auth-modal');
    if (!m) { m = document.createElement('div'); m.id = 'auth-modal'; m.className = 'auth-modal'; document.body.appendChild(m); }
    m.innerHTML = `
      <div class="auth-box">
        <button class="auth-x" aria-label="Fechar">✕</button>
        <div class="auth-tabs">
          <button class="auth-tab active" data-t="entrar">Entrar</button>
          <button class="auth-tab" data-t="criar">Criar conta</button>
        </div>
        <div class="auth-campos">
          <label class="auth-nome" style="display:none"><span>Seu nome</span><input id="au-nome" type="text" placeholder="como quer ser chamado"></label>
          <label><span>E-mail</span><input id="au-email" type="email" placeholder="voce@email.com"></label>
          <label><span>Senha</span><input id="au-pass" type="password" placeholder="mínimo 6 caracteres"></label>
          <button class="auth-btn full" id="au-go">Entrar</button>
          <p class="auth-msg" id="au-msg"></p>
        </div>
      </div>`;
    m.classList.add('open');
    let modo = 'entrar';
    const q = (s) => m.querySelector(s);
    q('.auth-x').onclick = () => m.classList.remove('open');
    m.onclick = (e) => { if (e.target === m) m.classList.remove('open'); };
    m.querySelectorAll('.auth-tab').forEach((t) => t.onclick = () => {
      modo = t.dataset.t;
      m.querySelectorAll('.auth-tab').forEach((x) => x.classList.toggle('active', x === t));
      q('.auth-nome').style.display = modo === 'criar' ? '' : 'none';
      q('#au-go').textContent = modo === 'criar' ? 'Criar conta' : 'Entrar';
      q('#au-msg').textContent = '';
    });
    q('#au-go').onclick = async () => {
      const email = q('#au-email').value.trim(), pass = q('#au-pass').value, nome = q('#au-nome').value.trim();
      const msg = q('#au-msg'); msg.textContent = 'aguarde…'; msg.className = 'auth-msg';
      try {
        if (modo === 'criar') {
          const { error } = await api.signUp(email, pass, nome || email.split('@')[0]);
          if (error) throw error;
          msg.textContent = 'Conta criada! Se pedir confirmação, verifique seu e-mail. Já pode entrar.';
          msg.className = 'auth-msg ok';
        } else {
          const { error } = await api.signIn(email, pass);
          if (error) throw error;
          location.reload();
        }
      } catch (e) { msg.textContent = traduzErro(e.message); msg.className = 'auth-msg erro'; }
    };
  }
  function traduzErro(m) {
    if (/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/already registered/i.test(m)) return 'Esse e-mail já tem conta. Tente entrar.';
    if (/at least 6/i.test(m)) return 'A senha precisa de pelo menos 6 caracteres.';
    if (/confirm/i.test(m)) return 'Confirme seu e-mail antes de entrar.';
    return m;
  }
  window.PDDApi.abrirModal = abrirModal;

  /* ───────────────────── UI: bloco de comentários ────────────────────────── */
  api.montarComentarios = async function (container, tipo, alvoId) {
    if (!container) return;
    if (!sb) { container.innerHTML = '<p class="muted">Comentários indisponíveis (configure o Supabase).</p>'; return; }
    const u = await api.user();
    const lista = await api.comentarios(tipo, alvoId);
    const admin = await api.isAdmin();
    container.innerHTML = '<h3 class="coment-titulo">Comentários</h3>';
    const box = document.createElement('div'); box.className = 'coment-lista';
    if (!lista.length) box.innerHTML = '<p class="muted">Seja o primeiro a comentar.</p>';
    lista.forEach((c) => {
      const el = document.createElement('div'); el.className = 'coment';
      const quando = new Date(c.created_at).toLocaleDateString('pt-BR');
      el.innerHTML = `<div class="coment-h"><strong>${esc(c.autor_nome || 'alguém')}</strong><span>${quando}</span></div><p>${esc(c.texto)}</p>`;
      if (u && (u.id === c.user_id || admin)) {
        const del = document.createElement('button'); del.className = 'coment-del'; del.textContent = 'apagar';
        del.onclick = async () => { await api.delComentario(c.id); api.montarComentarios(container, tipo, alvoId); };
        el.querySelector('.coment-h').appendChild(del);
      }
      box.appendChild(el);
    });
    container.appendChild(box);
    if (u) {
      const form = document.createElement('div'); form.className = 'coment-form';
      form.innerHTML = `<textarea id="cm-txt" rows="2" placeholder="escreva um comentário…"></textarea><button class="auth-btn" id="cm-go">comentar</button>`;
      container.appendChild(form);
      form.querySelector('#cm-go').onclick = async () => {
        const t = form.querySelector('#cm-txt').value.trim(); if (!t) return;
        await api.addComentario(tipo, alvoId, t, nomeDe(u));
        api.montarComentarios(container, tipo, alvoId);
      };
    } else {
      const p = document.createElement('p'); p.className = 'muted';
      p.innerHTML = 'Entre na sua conta pra comentar. ';
      const b = document.createElement('button'); b.className = 'auth-link-btn'; b.textContent = 'Entrar';
      b.onclick = abrirModal; p.appendChild(b); container.appendChild(p);
    }
  };

  /* ───────────────────── UI: botão de favoritar ──────────────────────────── */
  api.montarFavorito = async function (container, pauta) {
    if (!container || !sb) return;
    const u = await api.user();
    const btn = document.createElement('button'); btn.className = 'fav-btn';
    async function pintar() {
      if (!u) { btn.innerHTML = '♡ salvar nos favoritos'; return; }
      const fav = await api.isFav(pauta.id);
      btn.classList.toggle('on', fav);
      btn.innerHTML = fav ? '♥ salvo nos favoritos' : '♡ salvar nos favoritos';
    }
    btn.onclick = async () => {
      if (!u) { abrirModal(); return; }
      const fav = await api.isFav(pauta.id);
      if (fav) await api.delFav(pauta.id); else await api.addFav(pauta);
      pintar();
    };
    await pintar();
    container.appendChild(btn);
  };

  document.addEventListener('DOMContentLoaded', montarAuthbar);
})();
