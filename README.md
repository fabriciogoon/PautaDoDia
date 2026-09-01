# Pauta do Dia

Um site que puxa notícias de portais de **marketing, publicidade, branding e design**, e transforma cada manchete em **ideias de conteúdo** — cada uma com um **prompt pronto** pra colar na sua IA e gerar o post. Tem também uma **Central** no topo com a leitura do momento (o que está em alta, o que pode funcionar, o que evitar), que muda a cada 2 dias. E se atualiza sozinho, todo dia.

- 📰 Junta notícias de vários portais do setor (RSS).
- 🧭 **Central**: leitura estratégica do momento, a cada 2 dias.
- 🎯 Aba lateral por **tema** (Branding, Design, Social Media, Publicidade, Tendências, IA & Tech).
- 🖱️ Clicou na notícia → abre a **página dela**, com as ideias em forma de **prompt** (copiar, ou abrir direto no ChatGPT/Claude).
- 🤖 Um robô atualiza tudo **uma vez por dia**, de graça, sem servidor.

## Ver rodando no seu computador

Precisa do [Node.js](https://nodejs.org) (18+). Dentro da pasta:

```bash
node scripts/servir.mjs
```

Abra **http://localhost:5173**. (Não adianta abrir o `index.html` no clique — o navegador bloqueia a leitura dos dados. Use o comando acima.)

O projeto já vem com uma **edição de amostra** pra ver o visual. Para puxar notícias de verdade:

```bash
node scripts/gerar.mjs
```

## Mexer no conteúdo (sem programar)

- **Portais de notícia** → `scripts/fontes.mjs` (uma linha por site).
- **Temas da aba** → `scripts/segmentos.mjs` (nome, emoji, palavras-chave).
- **Como a notícia vira prompt** → `scripts/ideias.mjs`.
- **A Central (leitura do momento)** → `scripts/central.mjs`.
- **Aparência** → `assets/styles.css` (cores no topo, em `:root`).

## Publicar de graça + automático (GitHub)

1. Suba esta pasta num repositório **público**.
2. **Settings → Pages** → publicar a partir da branch `main` (raiz).
3. A automação diária já está em `.github/workflows/atualizar.yml`. Todo dia às 6h (Brasília) o robô roda e atualiza o site. Dá pra rodar na hora em **Actions → Run workflow**.
4. Deixe ligada a permissão: **Settings → Actions → General → Workflow permissions → Read and write**.

## Ideias/Central escritas por IA (opcional)

Sem chave, tudo já funciona (prompts montados por template, Central por acervo rotativo). Com uma chave da Anthropic, a Central passa a ser escrita na hora, usando as manchetes do dia:

- No GitHub: **Settings → Secrets and variables → Actions → New repository secret**, nome `ANTHROPIC_API_KEY`.

## Estrutura

```
index.html            home (Central + mural)
pauta.html            página de cada notícia (ideias em prompt)
assets/
  styles.css          visual (cores no topo)
  app.js              home
  pauta.js            página de detalhe
data/
  feed.json           as pautas do dia
  central.json        a leitura do momento (a cada 2 dias)
scripts/
  fontes.mjs          portais
  segmentos.mjs       temas da aba
  ideias.mjs          notícia → perspectiva + prompt
  central.mjs         leitura do momento
  gerar.mjs           o robô (1x/dia)
  servir.mjs          servidor local pra preview
.github/workflows/    automação diária
```

Feito por **Fabrício Barreto Gonçalves** · [@fabricio_dsgn](https://instagram.com/fabricio_dsgn)
