// scripts/servir.mjs — servidor local pra ver o site no navegador.
// Use:  node scripts/servir.mjs   → abre em http://localhost:5173
// (Abrir o index.html direto no navegador não funciona: o navegador bloqueia
//  a leitura do feed.json por segurança. Por isso este servidorzinho.)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(fileURLToPath(import.meta.url), '..', '..');
const PORTA = process.env.PORT || 5173;
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    let caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (caminho === '/') caminho = '/index.html';
    const abs = normalize(join(RAIZ, caminho));
    if (!abs.startsWith(RAIZ)) { res.writeHead(403).end('proibido'); return; }
    const dados = await readFile(abs);
    res.writeHead(200, { 'content-type': TIPOS[extname(abs)] || 'application/octet-stream' });
    res.end(dados);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('não encontrado');
  }
}).listen(PORTA, () => console.log(`\n▶  Pauta do Dia rodando em  http://localhost:${PORTA}\n   (Ctrl+C para parar)\n`));
