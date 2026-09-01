// scripts/gerar.mjs
// O robô da casa. Roda uma vez por dia (via GitHub Actions) e faz:
//   1. busca as notícias mais recentes de cada fonte (RSS/Atom)
//   2. transforma cada manchete em ideias de post
//   3. grava tudo em data/feed.json — que é o que o site lê
//
// Rodar na mão:   node scripts/gerar.mjs
// Testar offline: node scripts/gerar.mjs --amostra   (usa fixtures/*.xml locais)

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FONTES, MAX_PAUTAS, POR_FONTE } from './fontes.mjs';
import { gerarIdeias } from './ideias.mjs';
import { classificar, CATALOGO } from './segmentos.mjs';
import { gerarCentral } from './central.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, '..');
const AMOSTRA = process.argv.includes('--amostra');

/* ───────────────────────── busca (rede ou arquivo) ──────────────────────── */
async function baixar(url) {
  if (url.startsWith('file:') || url.startsWith('/') || url.startsWith('./')) {
    return readFileSync(url.replace('file://', ''), 'utf8');
  }
  const res = await fetch(url, {
    headers: { 'user-agent': 'PautaDoDia/1.0 (+github actions)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/* ─────────────────────── parser RSS/Atom minimalista ────────────────────── */
function tag(bloco, nome) {
  const m = bloco.match(new RegExp(`<${nome}[^>]*>([\\s\\S]*?)</${nome}>`, 'i'));
  return m ? limpar(m[1]) : '';
}
function linkAtom(bloco) {
  const m = bloco.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>(?:<\/link>)?/i);
  return m ? m[1] : '';
}
function limpar(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function parseFeed(xml) {
  const itens = [];
  const blocos = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  for (const b of blocos) {
    const titulo = tag(b, 'title');
    if (!titulo) continue;
    const url = tag(b, 'link') || linkAtom(b);
    const resumo = tag(b, 'description') || tag(b, 'summary') || tag(b, 'content');
    const data = tag(b, 'pubDate') || tag(b, 'updated') || tag(b, 'published');
    itens.push({ titulo, url, resumo: resumo.slice(0, 220), data });
  }
  return itens;
}

/* ─────────────────────────── amostra p/ teste ───────────────────────────── */
function fontesAmostra() {
  const dir = join(RAIZ, 'fixtures');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.xml')).map((f) => {
    const base = f.replace(/\.xml$/, '');
    const [nome, categoria = 'Geral'] = base.split('~');
    return { nome, categoria, url: join(dir, f) };
  });
}

/* ─────────────────────────────── principal ──────────────────────────────── */
function idDe(url, titulo) {
  // hash do endereço INTEIRO (não só do começo) — id único por notícia.
  const base = (url || titulo || '').trim();
  let h = 0x811c9dc5;
  for (let i = 0; i < base.length; i++) { h ^= base.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return 'p_' + (h >>> 0).toString(36);
}
function quando(data) {
  const d = data ? new Date(data) : new Date();
  return isNaN(+d) ? new Date().toISOString() : d.toISOString();
}

async function main() {
  const fontes = AMOSTRA ? fontesAmostra() : FONTES;
  const cruas = [];

  for (const fonte of fontes) {
    try {
      const xml = await baixar(fonte.url);
      const itens = parseFeed(xml).slice(0, POR_FONTE);
      for (const it of itens) {
        cruas.push({
          id: idDe(it.url, it.titulo),
          titulo: it.titulo,
          resumo: it.resumo,
          fonte: fonte.nome,
          categoria: fonte.categoria,
          url: it.url,
          publicado_em: quando(it.data),
        });
      }
      console.log(`✓ ${fonte.nome}: ${itens.length} pautas`);
    } catch (e) {
      console.warn(`✗ ${fonte.nome}: ${e.message} (pulando)`);
    }
  }

  // ordena por mais recente, tira repetidas e corta no máximo
  const vistos = new Set();
  const ordenadas = cruas
    .sort((a, b) => +new Date(b.publicado_em) - +new Date(a.publicado_em))
    .filter((p) => (vistos.has(p.titulo) ? false : vistos.add(p.titulo)))
    .slice(0, MAX_PAUTAS);

  // classifica o nicho e gera as ideias já cientes dele
  const pautas = [];
  for (const p of ordenadas) {
    const segmentos = classificar(p);
    const ideias = await gerarIdeias({ ...p, segmentos });
    pautas.push({ ...p, segmentos, ideias });
  }

  const agora = new Date();
  const feed = {
    gerado_em: agora.toISOString(),
    edicao: agora.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' }),
    total: pautas.length,
    segmentos: CATALOGO,
    pautas,
  };

  writeFileSync(join(RAIZ, 'data', 'feed.json'), JSON.stringify(feed, null, 2));
  console.log(`\n📰 feed.json gerado com ${pautas.length} pautas (${feed.edicao}).`);

  // Central: só regenera a cada 2 dias (senão reaproveita a existente).
  const centralPath = join(RAIZ, 'data', 'central.json');
  let central = null;
  if (existsSync(centralPath)) {
    try {
      const atual = JSON.parse(readFileSync(centralPath, 'utf8'));
      const idadeDias = (Date.now() - new Date(atual.gerado_em)) / 86400000;
      if (idadeDias < 2) central = atual;
    } catch { /* regenera */ }
  }
  if (!central) {
    central = await gerarCentral(pautas);
    writeFileSync(centralPath, JSON.stringify(central, null, 2));
    console.log('🧭 central.json atualizado (leitura do momento).');
  } else {
    console.log('🧭 central.json ainda recente (< 2 dias) — mantido.');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
