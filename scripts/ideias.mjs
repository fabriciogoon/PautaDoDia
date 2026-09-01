// scripts/ideias.mjs
// Cada notícia vira algumas ideias de conteúdo enxutas: uma PERSPECTIVA (o ângulo)
// e um PROMPT pronto pra colar em qualquer IA e gerar o conteúdo de verdade.
//
// Sem depender de chave: os prompts são montados por aqui, já certinhos.
// (Não usa IA pra gerar isto — é template puro e determinístico.)

import { TEMA_LABEL } from './segmentos.mjs';

function assunto(t) { return t.replace(/["'\u201c\u201d]/g, '').trim().replace(/\.$/, ''); }

function temaDe(pauta) {
  const id = (pauta.segmentos && pauta.segmentos[0]) || null;
  return (id && TEMA_LABEL[id]) || 'marketing e conteúdo';
}

// Especificação de cada formato: como pedir e o que a IA deve entregar.
const FORMATO = {
  Carrossel: {
    pede: 'um carrossel de 5 a 7 cards para o Instagram',
    entrega: 'o texto de cada card (capa com gancho, desenvolvimento e card final com CTA), mais a legenda e 5 hashtags',
  },
  Reel: {
    pede: 'um roteiro de Reels de até 30 segundos',
    entrega: 'o gancho dos primeiros 3 segundos, o roteiro cena a cena (fala + o que aparece na tela), a legenda e uma sugestão de áudio/trend',
  },
  'Post único': {
    pede: 'um post único (arte + legenda)',
    entrega: 'a frase de capa da arte, a legenda completa e o CTA',
  },
  Story: {
    pede: 'uma sequência de 3 a 4 stories',
    entrega: 'o conteúdo de cada tela, incluindo uma enquete e uma caixinha de perguntas',
  },
};

// Ângulos possíveis (perspectiva + formato + objetivo). O prompt é montado a partir daqui.
const ANGULOS = [
  { formato: 'Carrossel', objetivo: 'Autoridade',
    perspectiva: 'Traduzir a notícia: o que ela muda na prática pra quem acompanha o perfil.' },
  { formato: 'Reel', objetivo: 'Engajar',
    perspectiva: 'Dar uma opinião com posição clara sobre o assunto e convidar o público a concordar ou discordar.' },
  { formato: 'Carrossel', objetivo: 'Engajar',
    perspectiva: 'Formato "mito x verdade" sobre o tema, quebrando crenças comuns.' },
  { formato: 'Reel', objetivo: 'Autoridade',
    perspectiva: 'Transformar a notícia em 3 lições rápidas e aplicáveis.' },
  { formato: 'Post único', objetivo: 'Autoridade',
    perspectiva: 'Um posicionamento de especialista: o ângulo que a maioria não percebeu.' },
  { formato: 'Story', objetivo: 'Relacionamento',
    perspectiva: 'Puxar conversa com o público a partir do assunto (enquete + caixinha).' },
  { formato: 'Carrossel', objetivo: 'Vender',
    perspectiva: 'Usar o assunto em alta como gancho pra apresentar seu produto/serviço sem forçar.' },
  { formato: 'Reel', objetivo: 'Informar',
    perspectiva: 'Explicar o assunto em 15 segundos pra quem tem pressa.' },
];

function montarPrompt(pauta, ang, tema) {
  const f = FORMATO[ang.formato] || FORMATO['Post único'];
  const t = assunto(pauta.titulo);
  return [
    `Aja como um social media e copywriter especialista em ${tema}.`,
    `Crie ${f.pede} a partir desta notícia:`,
    `"${t}" (fonte: ${pauta.fonte}).`,
    ``,
    `Ângulo do conteúdo: ${ang.perspectiva}`,
    ``,
    `Antes de escrever, considere:`,
    `- Marca / cliente: [descreva aqui a marca, o tom de voz e o público]`,
    `- Objetivo do post: ${ang.objetivo}`,
    ``,
    `Regras: português do Brasil, linguagem natural e humana (nada genérico ou robótico),`,
    `um gancho forte logo no começo, e foco em gerar ${ang.objetivo.toLowerCase()}.`,
    ``,
    `Entregue: ${f.entrega}.`,
  ].join('\n');
}

function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

export function gerarIdeias(pauta) {
  const tema = temaDe(pauta);
  const ordem = [...ANGULOS.keys()].sort((a, b) =>
    ((hashCode(pauta.id + ':' + a) & 0xffff) - (hashCode(pauta.id + ':' + b) & 0xffff)));
  return ordem.slice(0, 3).map((i) => {
    const ang = ANGULOS[i];
    return {
      formato: ang.formato,
      objetivo: ang.objetivo,
      perspectiva: ang.perspectiva,
      prompt: montarPrompt(pauta, ang, tema),
    };
  });
}
