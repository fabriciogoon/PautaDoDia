// scripts/central.mjs
// A "Central" do topo: uma leitura estratégica do momento, atualizada a cada 2 dias.
// Não é prompt nem post pronto — é conteúdo pra pensar: o que está em alta,
// o que tende a funcionar, o que evitar e o que ficar de olho.
//
// Sem chave: rotaciona um acervo curado (muda a cada 2 dias).
// Com ANTHROPIC_API_KEY: escreve uma leitura fresca, usando as manchetes do dia como contexto.

const EDICOES = [
  {
    blocos: [
      { tipo: 'Em alta', itens: [
        'Conteúdo de bastidor: mostrar o processo (não só o resultado) segue puxando salvamento e comentário.',
        'Reels curtos (até 15s) com gancho nos 2 primeiros segundos.',
        'Marcas com posicionamento claro e opinião — o "em cima do muro" perde espaço.',
      ] },
      { tipo: 'Pode funcionar', itens: [
        'Carrossel "mito x verdade" do seu nicho: educa e provoca comentário.',
        'Pegar carona em um assunto do momento e conectar ao seu serviço, sem forçar a venda.',
      ] },
      { tipo: 'Evite', itens: [
        'Legenda genérica de IA ("descubra agora", "neste post vamos"): o público reconhece e passa reto.',
        'Postar só quando tem promoção — sem constância, o alcance despenca.',
      ] },
      { tipo: 'Fique de olho', itens: [
        'Tipografia grande e ousada voltando com força na identidade de marcas.',
      ] },
    ],
  },
  {
    blocos: [
      { tipo: 'Em alta', itens: [
        'Storytelling pessoal: a história por trás da marca conecta mais que o produto sozinho.',
        'UGC (conteúdo do próprio cliente) ganhando dos anúncios muito produzidos.',
        'Paletas terrosas e naturais dominando o design de marca em 2026.',
      ] },
      { tipo: 'Pode funcionar', itens: [
        'Série de conteúdo com identidade fixa (mesmo template toda semana) pra criar reconhecimento.',
        'Trazer dados/números do seu mercado num post — autoridade instantânea.',
      ] },
      { tipo: 'Evite', itens: [
        'Seguir toda trend só porque está bombando — se não tem a ver com a marca, queima a percepção.',
        'Excesso de hashtag: hoje pesa mais o gancho e a retenção do que 30 hashtags.',
      ] },
      { tipo: 'Fique de olho', itens: [
        'IA generativa entrando na produção das agências — quem usa bem ganha velocidade.',
      ] },
    ],
  },
  {
    blocos: [
      { tipo: 'Em alta', itens: [
        'Nostalgia (referências dos anos 2000) rendendo engajamento em campanhas.',
        'Vídeos "talking head" com boa edição e legenda na tela — baratos e eficientes.',
        'Design minimalista com um detalhe expressivo (uma cor, um traço) que vira assinatura.',
      ] },
      { tipo: 'Pode funcionar', itens: [
        'Antes e depois de um projeto (branding, ambiente, resultado) em carrossel.',
        'Responder as dúvidas mais comuns do cliente em formato de post — SEO social.',
      ] },
      { tipo: 'Evite', itens: [
        'Arte linda sem mensagem clara: bonito não segura sozinho, precisa de gancho.',
        'Copiar o concorrente: o público percebe e o diferencial some.',
      ] },
      { tipo: 'Fique de olho', itens: [
        'Formatos verticais em alta também no LinkedIn e no YouTube (Shorts).',
      ] },
    ],
  },
  {
    blocos: [
      { tipo: 'Em alta', itens: [
        'Marcas humanizando o tom — falar como gente, não como institucional.',
        'Conteúdo educativo "salvável" (checklists, guias rápidos) rendendo alcance.',
        'Motion e microanimações dando vida a posts estáticos.',
      ] },
      { tipo: 'Pode funcionar', itens: [
        'Enquete e caixinha nos stories pra transformar a audiência em pauta.',
        'Pegar uma notícia do setor e dar a sua leitura de especialista.',
      ] },
      { tipo: 'Evite', itens: [
        'Prometer demais na headline e não entregar no conteúdo — mata a confiança.',
        'Ignorar os comentários: engajamento é troca, não vitrine.',
      ] },
      { tipo: 'Fique de olho', itens: [
        'Busca dentro do Instagram/TikTok crescendo — vale pensar em "palavras-chave" nas legendas.',
      ] },
    ],
  },
];

function indicePorData(d = new Date()) {
  // muda a cada 2 dias
  const dias = Math.floor(d.getTime() / 86400000);
  return Math.floor(dias / 2) % EDICOES.length;
}

async function gerarPorIA(pautas) {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
  const manchetes = (pautas || []).slice(0, 12).map((p) => '- ' + p.titulo).join('\n');
  const prompt = 'Você é um estrategista de marketing e conteúdo. Escreva uma "leitura do momento" curta e afiada pra social media e designers, em português do Brasil, sem cara de IA. Use as manchetes de hoje como contexto do que está circulando.\n\nMANCHETES DE HOJE:\n' + manchetes + '\n\nResponda SOMENTE um JSON:\n{"blocos":[{"tipo":"Em alta","itens":["..."]},{"tipo":"Pode funcionar","itens":["..."]},{"tipo":"Evite","itens":["..."]},{"tipo":"Fique de olho","itens":["..."]}]}\nCada bloco com 2 ou 3 itens curtos e concretos.';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model, max_tokens: 1200, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error('IA falhou: ' + res.status);
  const data = await res.json();
  const txt = (data.content || []).map((c) => c.text || '').join('');
  const json = JSON.parse(txt.replace(/```json|```/g, '').trim());
  if (!Array.isArray(json.blocos) || !json.blocos.length) throw new Error('IA vazia');
  return json.blocos;
}

export async function gerarCentral(pautas) {
  let blocos;
  if (process.env.ANTHROPIC_API_KEY) {
    try { blocos = await gerarPorIA(pautas); } catch { /* cai no acervo */ }
  }
  if (!blocos) blocos = EDICOES[indicePorData()].blocos;
  const agora = new Date();
  return {
    gerado_em: agora.toISOString(),
    titulo: 'Leitura do momento',
    subtitulo: 'O que observar agora — atualiza a cada 2 dias',
    blocos,
  };
}
