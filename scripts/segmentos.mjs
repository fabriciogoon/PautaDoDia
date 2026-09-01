// scripts/segmentos.mjs
// Os TEMAS que aparecem na aba lateral — voltados a marketing, design e conteúdo.
// O robô lê título + resumo de cada pauta e marca em quais temas ela encaixa.

export const SEGMENTOS = [
  { id: 'branding', nome: 'Branding', emoji: '🏷️',
    palavras: ['marca', 'marcas', 'branding', 'rebranding', 'identidade', 'posicionamento', 'logo', 'logotipo', 'naming', 'storytelling'],
    categorias: ['Branding'] },
  { id: 'design', nome: 'Design', emoji: '🎨',
    palavras: ['design', 'tipografia', 'tipográfico', 'cor', 'cores', 'paleta', 'layout', 'identidade visual', 'embalagem', 'packaging', 'ux', 'ui', 'minimalista'],
    categorias: ['Design'] },
  { id: 'social', nome: 'Social Media', emoji: '📱',
    palavras: ['instagram', 'tiktok', 'reels', 'reel', 'story', 'stories', 'engajamento', 'algoritmo', 'creator', 'criador', 'influenciador', 'influenciadores', 'feed', 'conteúdo'],
    categorias: ['Social'] },
  { id: 'publicidade', nome: 'Publicidade', emoji: '📣',
    palavras: ['campanha', 'campanhas', 'anúncio', 'anúncios', 'publicidade', 'propaganda', 'mídia', 'comercial', 'ativação', 'agência', 'agências'],
    categorias: ['Publicidade', 'Marketing'] },
  { id: 'tendencias', nome: 'Tendências', emoji: '🔥',
    palavras: ['tendência', 'tendências', 'trend', 'trends', 'viral', 'viralizou', 'comportamento', 'cultura', 'geração', 'futuro', 'nostalgia'],
    categorias: ['Tendências'] },
  { id: 'ia-tech', nome: 'IA & Tech', emoji: '🤖',
    palavras: ['inteligência artificial', 'ia generativa', 'tecnologia', 'ferramenta', 'ferramentas', 'app', 'digital', 'automação', 'chatgpt'],
    categorias: ['Tecnologia'] },
];

export function classificar(pauta) {
  const texto = `${pauta.titulo} ${pauta.resumo || ''}`.toLowerCase();
  const tokens = new Set(texto.split(/[^0-9a-zà-ÿ]+/).filter(Boolean));
  const casa = (kw) => {
    if (kw.includes(' ') || kw.includes('-')) return texto.includes(kw);
    if (tokens.has(kw) || tokens.has(kw + 's')) return true;
    if (kw.endsWith('s') && tokens.has(kw.slice(0, -1))) return true;
    return false;
  };
  const ids = [];
  for (const s of SEGMENTOS) {
    const porPalavra = s.palavras.some(casa);
    const porCategoria = (s.categorias || []).includes(pauta.categoria);
    if (porPalavra || porCategoria) ids.push(s.id);
  }
  return ids;
}

export const CATALOGO = SEGMENTOS.map(({ id, nome, emoji }) => ({ id, nome, emoji }));

// Rótulo amigável do tema pra usar dentro do prompt.
export const TEMA_LABEL = {
  branding: 'branding e construção de marca', design: 'design gráfico e identidade visual',
  social: 'social media e conteúdo para redes', publicidade: 'publicidade e campanhas',
  tendencias: 'tendências de mercado e cultura', 'ia-tech': 'IA e tecnologia aplicadas ao marketing',
};
