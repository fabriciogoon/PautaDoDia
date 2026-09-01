// scripts/fontes.mjs
// Fontes focadas em Marketing, Branding, Design, Publicidade e Tendências.
// Uma linha por site. Para adicionar/remover, é só mexer aqui.
//   nome | categoria | url (RSS — quase sempre o site + "/feed" ou "/feed/")

export const FONTES = [
  { nome: 'Meio & Mensagem',        categoria: 'Marketing',    url: 'https://www.meioemensagem.com.br/feed' },
  { nome: 'Propmark',               categoria: 'Publicidade',  url: 'https://propmark.com.br/feed/' },
  { nome: 'Publicitários Criativos', categoria: 'Criatividade', url: 'https://www.publicitarioscriativos.com/feed/' },
  { nome: 'GKPB',                   categoria: 'Publicidade',  url: 'https://gkpb.com.br/feed/' },
  { nome: 'B9',                     categoria: 'Comunicação',  url: 'https://www.b9.com.br/feed/' },
  { nome: 'Chief of Design',        categoria: 'Design',       url: 'https://www.chiefofdesign.com.br/feed/' },

  // Para acrescentar outro portal, copie uma linha e troque nome/categoria/url.
  // Ex.: { nome: 'Meu Blog', categoria: 'Design', url: 'https://meublog.com.br/feed/' },
];

export const MAX_PAUTAS = 24;
export const POR_FONTE = 8;
