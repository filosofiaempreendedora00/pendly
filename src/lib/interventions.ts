import { getTodayKey } from './pendulum';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ZonaNome =
  | 'autopiedade'
  | 'autocompaixao'
  | 'equilibrio'
  | 'autorresponsabilidade'
  | 'autoflagelo';

export type TipoIntervencao = 'pergunta' | 'reframing' | 'micro_acao' | 'respiracao';

export interface InterventionCard {
  id: string;
  zonaPrincipal: ZonaNome;
  tipo: TipoIntervencao;
  /** Internal tags used to refine selection — never shown in UI */
  categoriasAuxiliares: string[];
  texto: string;
  intensidade: 'leve' | 'media' | 'forte';
}

// ─── Library ──────────────────────────────────────────────────────────────────

const LIBRARY: InterventionCard[] = [

  // ══ AUTOPIEDADE (0–15) ══════════════════════════════════════════════════════

  // pergunta
  { id: 'ap_per_01', zonaPrincipal: 'autopiedade', tipo: 'pergunta', intensidade: 'forte',
    categoriasAuxiliares: ['ansiedade', 'isolamento'],
    texto: 'O que você acha que está te impedindo de dar o próximo passo, por menor que seja?' },
  { id: 'ap_per_02', zonaPrincipal: 'autopiedade', tipo: 'pergunta', intensidade: 'media',
    categoriasAuxiliares: ['isolamento'],
    texto: 'Tem alguém com quem você confia e poderia falar hoje, mesmo que seja por mensagem?' },
  { id: 'ap_per_03', zonaPrincipal: 'autopiedade', tipo: 'pergunta', intensidade: 'forte',
    categoriasAuxiliares: ['exaustao'],
    texto: 'O que você precisaria sentir pra conseguir dar um passo à frente — mesmo que pequeno?' },

  // reframing
  { id: 'ap_ref_01', zonaPrincipal: 'autopiedade', tipo: 'reframing', intensidade: 'forte',
    categoriasAuxiliares: ['exaustao', 'sobrecarga'],
    texto: 'Você não está quebrado(a). Você está carregando peso demais pra carregar sozinho(a) agora. Isso é diferente.' },
  { id: 'ap_ref_02', zonaPrincipal: 'autopiedade', tipo: 'reframing', intensidade: 'media',
    categoriasAuxiliares: ['culpa'],
    texto: 'Você já atravessou dias pesados antes — e está aqui. Isso diz algo sobre você que vale reconhecer.' },
  { id: 'ap_ref_03', zonaPrincipal: 'autopiedade', tipo: 'reframing', intensidade: 'forte',
    categoriasAuxiliares: ['isolamento'],
    texto: 'Sentir que está à deriva não é fraqueza. É um sinal de que você precisa de apoio — e isso é completamente humano.' },

  // micro_acao
  { id: 'ap_mac_01', zonaPrincipal: 'autopiedade', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: [],
    texto: 'Levante-se, vá até a cozinha e beba um copo d\'água devagar. Só isso. Volte aqui depois.' },
  { id: 'ap_mac_02', zonaPrincipal: 'autopiedade', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: ['ansiedade'],
    texto: 'Coloque a mão no peito por 30 segundos. Sinta seu próprio calor. Não precisa fazer mais nada agora.' },
  { id: 'ap_mac_03', zonaPrincipal: 'autopiedade', tipo: 'micro_acao', intensidade: 'media',
    categoriasAuxiliares: ['sobrecarga'],
    texto: 'Escolha uma coisa — só uma — que você pode largar hoje. Não carregar mais. Só hoje.' },

  // respiracao
  { id: 'ap_res_01', zonaPrincipal: 'autopiedade', tipo: 'respiracao', intensidade: 'forte',
    categoriasAuxiliares: ['ansiedade'],
    texto: 'Inspire contando até 4. Segure por 4. Expire contando até 6. Repita 3 vezes. Deixe o corpo desacelerar primeiro.' },
  { id: 'ap_res_02', zonaPrincipal: 'autopiedade', tipo: 'respiracao', intensidade: 'forte',
    categoriasAuxiliares: ['exaustao'],
    texto: 'Faça uma respiração longa e lenta. Ao expirar, imagine soltar um pouco do peso que está carregando. Repita 3 vezes.' },
  { id: 'ap_res_03', zonaPrincipal: 'autopiedade', tipo: 'respiracao', intensidade: 'media',
    categoriasAuxiliares: ['ansiedade'],
    texto: 'Inspire fundo pelo nariz, segure por um momento, expire pela boca com um leve suspiro. Deixe sair o que não precisa ficar.' },

  // ══ AUTOCOMPAIXÃO (15–35) ════════════════════════════════════════════════════

  // pergunta
  { id: 'ac_per_01', zonaPrincipal: 'autocompaixao', tipo: 'pergunta', intensidade: 'media',
    categoriasAuxiliares: ['procrastinacao'],
    texto: 'Existe algo que você tem adiado enquanto cuida de si mesmo? Só observar — sem julgamento nenhum.' },
  { id: 'ac_per_02', zonaPrincipal: 'autocompaixao', tipo: 'pergunta', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'O que você faria diferente hoje se soubesse que ninguém ia te julgar por isso?' },
  { id: 'ac_per_03', zonaPrincipal: 'autocompaixao', tipo: 'pergunta', intensidade: 'media',
    categoriasAuxiliares: ['procrastinacao'],
    texto: 'Essa gentileza consigo mesmo... ela vem de um lugar de cuidado real, ou pode estar evitando algo que precisa de atenção?' },

  // reframing
  { id: 'ac_ref_01', zonaPrincipal: 'autocompaixao', tipo: 'reframing', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Ser gentil consigo mesmo não é fuga. É o ponto de partida de qualquer mudança real e duradoura.' },
  { id: 'ac_ref_02', zonaPrincipal: 'autocompaixao', tipo: 'reframing', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Você está conseguindo se ver sem tanto julgamento. Isso é mais difícil do que parece — e você está fazendo.' },
  { id: 'ac_ref_03', zonaPrincipal: 'autocompaixao', tipo: 'reframing', intensidade: 'media',
    categoriasAuxiliares: [],
    texto: 'Autocompaixão não significa baixar o padrão. Significa cuidar de quem vai executar.' },

  // micro_acao
  { id: 'ac_mac_01', zonaPrincipal: 'autocompaixao', tipo: 'micro_acao', intensidade: 'leve',
    categoriasAuxiliares: ['procrastinacao'],
    texto: 'Pense — ou escreva — em uma coisa pequena que você quer fazer diferente amanhã. Só uma. Só o primeiro passo.' },
  { id: 'ac_mac_02', zonaPrincipal: 'autocompaixao', tipo: 'micro_acao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Faça algo que você genuinamente gosta hoje, sem justificar a produtividade disso.' },
  { id: 'ac_mac_03', zonaPrincipal: 'autocompaixao', tipo: 'micro_acao', intensidade: 'media',
    categoriasAuxiliares: ['procrastinacao'],
    texto: 'Se tem algo que você tem adiado, escreva só o primeiro passo — bem pequeno. Só o primeiro.' },

  // respiracao
  { id: 'ac_res_01', zonaPrincipal: 'autocompaixao', tipo: 'respiracao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Inspire fundo. Ao expirar devagar, imagine liberar algo que você não precisa mais carregar hoje.' },
  { id: 'ac_res_02', zonaPrincipal: 'autocompaixao', tipo: 'respiracao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Respire com calma por 1 minuto inteiro. Deixe o corpo absorver a gentileza que você está exercendo.' },
  { id: 'ac_res_03', zonaPrincipal: 'autocompaixao', tipo: 'respiracao', intensidade: 'media',
    categoriasAuxiliares: [],
    texto: 'Inspire pelo nariz contando 4, expire pela boca contando 4. Permita-se estar exatamente onde está.' },

  // ══ EQUILÍBRIO (35–65) ══════════════════════════════════════════════════════

  // pergunta
  { id: 'eq_per_01', zonaPrincipal: 'equilibrio', tipo: 'pergunta', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'O que mais contribuiu pra você estar assim hoje? Vale registrar mentalmente — esse estado tem uma receita.' },
  { id: 'eq_per_02', zonaPrincipal: 'equilibrio', tipo: 'pergunta', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Quando você sai desse ponto de equilíbrio, o que normalmente te tira? Conhecer o gatilho é metade do caminho.' },
  { id: 'eq_per_03', zonaPrincipal: 'equilibrio', tipo: 'pergunta', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Tem algo que você fez conscientemente hoje pra chegar aqui, ou veio de forma natural?' },

  // reframing
  { id: 'eq_ref_01', zonaPrincipal: 'equilibrio', tipo: 'reframing', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Equilíbrio não é sorte — é resultado de escolhas que você fez. Vale reconhecer isso.' },
  { id: 'eq_ref_02', zonaPrincipal: 'equilibrio', tipo: 'reframing', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Estar equilibrado não significa que nada está difícil. Significa que você está conseguindo lidar. Isso é diferente.' },
  { id: 'eq_ref_03', zonaPrincipal: 'equilibrio', tipo: 'reframing', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Você está aqui agora. Esse momento é real — e é suficiente.' },

  // micro_acao
  { id: 'eq_mac_01', zonaPrincipal: 'equilibrio', tipo: 'micro_acao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Faça uma coisa que você genuinamente gosta hoje — sem produtividade envolvida. Só porque sim.' },
  { id: 'eq_mac_02', zonaPrincipal: 'equilibrio', tipo: 'micro_acao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Registre mentalmente o que funcionou hoje. Esse equilíbrio tem uma fórmula que vale repetir.' },
  { id: 'eq_mac_03', zonaPrincipal: 'equilibrio', tipo: 'micro_acao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Compartilhe algo positivo com alguém hoje — uma palavra, um elogio, uma mensagem pequena.' },

  // respiracao
  { id: 'eq_res_01', zonaPrincipal: 'equilibrio', tipo: 'respiracao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Respire com calma por 1 minuto. Deixe o corpo absorver o equilíbrio que você está sentindo agora.' },
  { id: 'eq_res_02', zonaPrincipal: 'equilibrio', tipo: 'respiracao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Inspire contando 4, segure 4, expire 4. Sinta a estabilidade no seu próprio ritmo.' },
  { id: 'eq_res_03', zonaPrincipal: 'equilibrio', tipo: 'respiracao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Faça uma respiração profunda e consciente. Você merece esse momento de pausa — mesmo que breve.' },

  // ══ AUTORRESPONSABILIDADE (65–85) ════════════════════════════════════════════

  // pergunta
  { id: 'ar_per_01', zonaPrincipal: 'autorresponsabilidade', tipo: 'pergunta', intensidade: 'media',
    categoriasAuxiliares: ['perfeccionismo'],
    texto: 'Você está sendo exigente consigo por quê — porque quer crescer de verdade, ou porque sente que precisa se provar a alguém?' },
  { id: 'ar_per_02', zonaPrincipal: 'autorresponsabilidade', tipo: 'pergunta', intensidade: 'forte',
    categoriasAuxiliares: ['perfeccionismo', 'culpa'],
    texto: 'O que acontece dentro de você quando você não cumpre tudo que planejou?' },
  { id: 'ar_per_03', zonaPrincipal: 'autorresponsabilidade', tipo: 'pergunta', intensidade: 'leve',
    categoriasAuxiliares: ['sobrecarga'],
    texto: 'Tem algo que você está se cobrando hoje que poderia ver com mais leveza, sem perder a qualidade?' },

  // reframing
  { id: 'ar_ref_01', zonaPrincipal: 'autorresponsabilidade', tipo: 'reframing', intensidade: 'media',
    categoriasAuxiliares: ['perfeccionismo'],
    texto: 'Responsabilidade é uma virtude. Mas além de um certo ponto, ela vira punição disfarçada de disciplina.' },
  { id: 'ar_ref_02', zonaPrincipal: 'autorresponsabilidade', tipo: 'reframing', intensidade: 'forte',
    categoriasAuxiliares: ['sobrecarga'],
    texto: 'Você pode fazer menos hoje e ainda estar bem. Essa frase é verdadeira — mesmo que seja difícil acreditar nela agora.' },
  { id: 'ar_ref_03', zonaPrincipal: 'autorresponsabilidade', tipo: 'reframing', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Cuidar de quem executa também é parte da responsabilidade. Você faz parte da equipe.' },

  // micro_acao
  { id: 'ar_mac_01', zonaPrincipal: 'autorresponsabilidade', tipo: 'micro_acao', intensidade: 'media',
    categoriasAuxiliares: ['sobrecarga', 'procrastinacao'],
    texto: 'Escolha uma coisa da sua lista mental e mova conscientemente pra amanhã. Isso não é desistir — é respeitar seus recursos.' },
  { id: 'ar_mac_02', zonaPrincipal: 'autorresponsabilidade', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: ['sobrecarga'],
    texto: 'Separe 15 minutos só pra você agora — sem produzir, sem se justificar. Só existir por um momento.' },
  { id: 'ar_mac_03', zonaPrincipal: 'autorresponsabilidade', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: ['perfeccionismo'],
    texto: 'Diga em voz alta: "Eu posso fazer menos hoje e ainda estar bem." Pode parecer estranho — tente assim mesmo.' },

  // respiracao
  { id: 'ar_res_01', zonaPrincipal: 'autorresponsabilidade', tipo: 'respiracao', intensidade: 'media',
    categoriasAuxiliares: ['ansiedade', 'sobrecarga'],
    texto: 'Inspire pelo nariz contando 4, segure por 4, expire pela boca contando 8. Sinta o sistema nervoso desacelerar.' },
  { id: 'ar_res_02', zonaPrincipal: 'autorresponsabilidade', tipo: 'respiracao', intensidade: 'forte',
    categoriasAuxiliares: ['sobrecarga'],
    texto: 'Faça 3 respirações profundas. A cada expiração, imagine soltar a pressão que está carregando. Devagar.' },
  { id: 'ar_res_03', zonaPrincipal: 'autorresponsabilidade', tipo: 'respiracao', intensidade: 'leve',
    categoriasAuxiliares: [],
    texto: 'Inspire fundo e expire bem devagar. Ao expirar, pense: "Posso descansar agora. Eu mereço isso."' },

  // ══ AUTOFLAGELO (85–100) ═════════════════════════════════════════════════════

  // pergunta
  { id: 'af_per_01', zonaPrincipal: 'autoflagelo', tipo: 'pergunta', intensidade: 'forte',
    categoriasAuxiliares: ['culpa', 'autocritica'],
    texto: 'O que aconteceu pra você sentir que merece tanta crítica de si mesmo(a) agora?' },
  { id: 'af_per_02', zonaPrincipal: 'autoflagelo', tipo: 'pergunta', intensidade: 'forte',
    categoriasAuxiliares: ['culpa', 'autocritica'],
    texto: 'Se um amigo próximo te contasse que se sente assim sobre si mesmo... o que você diria a ele?' },
  { id: 'af_per_03', zonaPrincipal: 'autoflagelo', tipo: 'pergunta', intensidade: 'forte',
    categoriasAuxiliares: ['autocritica', 'culpa'],
    texto: 'Você consegue separar o que você fez do que você é? Essa distinção existe — e ela importa.' },

  // reframing
  { id: 'af_ref_01', zonaPrincipal: 'autoflagelo', tipo: 'reframing', intensidade: 'forte',
    categoriasAuxiliares: ['autocritica'],
    texto: 'Você trataria um amigo da forma que está se tratando agora? Essa pergunta tem uma resposta que vale ouvir.' },
  { id: 'af_ref_02', zonaPrincipal: 'autoflagelo', tipo: 'reframing', intensidade: 'forte',
    categoriasAuxiliares: ['culpa', 'autocritica'],
    texto: 'Um erro não é uma identidade. Você não é a pior coisa que já fez — e nunca vai ser.' },
  { id: 'af_ref_03', zonaPrincipal: 'autoflagelo', tipo: 'reframing', intensidade: 'forte',
    categoriasAuxiliares: ['culpa', 'perfeccionismo'],
    texto: 'Ser duro(a) consigo não vai desfazer o que aconteceu. Mas compaixão pode te dar energia pra fazer diferente amanhã.' },

  // micro_acao
  { id: 'af_mac_01', zonaPrincipal: 'autoflagelo', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: ['autocritica', 'culpa'],
    texto: 'Diga em voz alta: "Eu cometi um erro. Isso não me define." Uma vez. Em voz alta — mesmo que seja difícil.' },
  { id: 'af_mac_02', zonaPrincipal: 'autoflagelo', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: ['autocritica'],
    texto: 'Escreva o que você diria a um amigo na mesma situação. Depois leia como se fosse pra você mesmo(a).' },
  { id: 'af_mac_03', zonaPrincipal: 'autoflagelo', tipo: 'micro_acao', intensidade: 'forte',
    categoriasAuxiliares: ['autocritica', 'culpa'],
    texto: 'Coloque a mão no peito e diga uma frase gentil pra si mesmo(a). Uma frase só. Pode ser difícil — esse é o ponto.' },

  // respiracao
  { id: 'af_res_01', zonaPrincipal: 'autoflagelo', tipo: 'respiracao', intensidade: 'forte',
    categoriasAuxiliares: ['ansiedade', 'autocritica'],
    texto: 'Inspire fundo, segure por 4 segundos, expire devagar. Ao expirar, imagine o peso da autocrítica saindo com o ar.' },
  { id: 'af_res_02', zonaPrincipal: 'autoflagelo', tipo: 'respiracao', intensidade: 'forte',
    categoriasAuxiliares: ['ansiedade'],
    texto: 'Faça 4 respirações lentas. A cada expiração, pense: "Estou aqui. Ainda estou inteiro(a)."' },
  { id: 'af_res_03', zonaPrincipal: 'autoflagelo', tipo: 'respiracao', intensidade: 'forte',
    categoriasAuxiliares: ['ansiedade'],
    texto: 'Inspire contando até 4. Expire contando até 8. Deixe o corpo ter um momento de paz — mesmo que a mente ainda esteja barulhenta.' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getZonaNome(position: number): ZonaNome {
  if (position < 15) return 'autopiedade';
  if (position < 35) return 'autocompaixao';
  if (position <= 65) return 'equilibrio';
  if (position <= 85) return 'autorresponsabilidade';
  return 'autoflagelo';
}

/**
 * Derives intensity from how deep the position is within its zone.
 * Used internally to prefer content matched to how intense the state feels.
 */
function getIntensidade(position: number): 'leve' | 'media' | 'forte' {
  const zona = getZonaNome(position);
  if (zona === 'autopiedade')            return position <= 6 ? 'forte' : position <= 11 ? 'media' : 'leve';
  if (zona === 'autocompaixao')          return 'leve';
  if (zona === 'equilibrio')             return 'leve';
  if (zona === 'autorresponsabilidade')  return position >= 81 ? 'forte' : position >= 74 ? 'media' : 'leve';
  /* autoflagelo */                      return position >= 95 ? 'forte' : position >= 90 ? 'media' : 'leve';
}

/** Deterministic daily seed — same output for the same date + zone. */
function computeSeed(dateKey: string, zona: ZonaNome): number {
  const str = `${dateKey}-${zona}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

/** Picks a pseudo-random index from [0, len) using seed + slot offset. */
function seededIndex(seed: number, slot: number, len: number): number {
  const s = Math.abs(Math.imul(seed + slot * 2654435761, 0x9e3779b9) | 0);
  return s % len;
}

function pickCard(
  pool: InterventionCard[],
  tipo: TipoIntervencao,
  intensidade: 'leve' | 'media' | 'forte',
  usedIds: Set<string>,
  seed: number,
  slot: number,
): InterventionCard | null {
  const byTipo = pool.filter(c => c.tipo === tipo && !usedIds.has(c.id));
  if (byTipo.length === 0) return null;

  // Prefer matching intensity; fall back to any available card of that tipo.
  const preferred = byTipo.filter(c => c.intensidade === intensidade);
  const candidates = preferred.length > 0 ? preferred : byTipo;

  return candidates[seededIndex(seed, slot, candidates.length)];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates a session of exactly 3 interventions for the given position.
 *
 * Structure:
 *   Slot 1 — cognitive reflection (reframing OR pergunta, alternated by day)
 *   Slot 2 — micro_acao
 *   Slot 3 — respiracao
 *
 * Selection is deterministic per day+zone but rotates daily.
 * Intensity signal refines the pick without changing the visible zone structure.
 */
export function generateInterventionSession(
  position: number,
  dateKey: string = getTodayKey(),
): InterventionCard[] {
  const zona       = getZonaNome(position);
  const intensidade = getIntensidade(position);
  const seed       = computeSeed(dateKey, zona);
  const pool       = LIBRARY.filter(c => c.zonaPrincipal === zona);
  const used       = new Set<string>();

  // Slot 1: alternate reframing / pergunta by day
  const slot1Tipo: TipoIntervencao = seed % 2 === 0 ? 'reframing' : 'pergunta';
  const card1 = pickCard(pool, slot1Tipo, intensidade, used, seed, 0);
  if (card1) used.add(card1.id);

  // Slot 2: micro_acao
  const card2 = pickCard(pool, 'micro_acao', intensidade, used, seed, 1);
  if (card2) used.add(card2.id);

  // Slot 3: respiracao
  const card3 = pickCard(pool, 'respiracao', intensidade, used, seed, 2);
  if (card3) used.add(card3.id);

  return [card1, card2, card3].filter(Boolean) as InterventionCard[];
}
