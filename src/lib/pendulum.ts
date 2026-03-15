// Pendulum position: 0 = far left (Autopiedade), 100 = far right (Autoflagelo)
// 50 = Equilíbrio (center)

export type DayPeriod = 'morning' | 'afternoon' | 'night';

export interface PendulumEntry {
  date: string; // ISO date string
  position: number; // 0-100
  period?: DayPeriod; // optional period for sub-entries
  timestamp?: string; // ISO datetime of when saved
  note?: string; // optional text note
  emotions?: string[]; // 1–3 emotions selected in the check-in modal
  photo?: string; // base64 data URL of an attached photo
  audio?: string; // base64 data URL of a recorded audio note
}

// ─── 5 status levels for emotion mapping ─────────────────────────────────────
export type StatusLevel =
  | 'muuuito-mal'
  | 'mal'
  | 'mais-ou-menos'
  | 'bem'
  | 'muuuito-bem';

export function getStatusLevel(position: number): StatusLevel {
  if (position <= 33) return 'muuuito-mal';
  if (position <= 44) return 'mal';
  if (position <= 56) return 'mais-ou-menos';
  if (position <= 78) return 'bem';
  return 'muuuito-bem';
}

export const CONTEXTUAL_EMOTIONS: Record<StatusLevel, string[]> = {
  'muuuito-mal': [
    'tristeza', 'ansiedade', 'angústia', 'desespero',
    'medo', 'raiva', 'pânico', 'culpa',
    'vergonha', 'frustração', 'vazio', 'impotência',
  ],
  'mal': [
    'tristeza', 'ansiedade', 'preocupação', 'raiva',
    'frustração', 'insegurança', 'desânimo', 'decepção',
    'tensão', 'insatisfação', 'melancolia', 'autocobrança',
  ],
  'mais-ou-menos': [
    'normal', 'cansaço', 'tédio', 'apatia',
    'dúvida', 'confusão', 'indecisão', 'dispersão',
    'curiosidade', 'reflexão', 'contemplação', 'expectativa',
  ],
  'bem': [
    'alegria', 'tranquilidade', 'satisfação', 'gratidão',
    'leveza', 'confiança', 'esperança', 'motivação',
    'entusiasmo', 'serenidade', 'inspiração', 'orgulho',
  ],
  'muuuito-bem': [
    'alegria', 'empolgação', 'euforia', 'gratidão',
    'realização', 'entusiasmo', 'plenitude', 'orgulho',
    'encantamento', 'admiração', 'inspiração', 'paixão',
  ],
};

// Shown only via "+ Ver mais emoções" — order varies by status so the most
// intuitive emotions appear first. Duplicates of the active contextual list
// are filtered out at render time.
export const ORDERED_UNIVERSAL_EMOTIONS: Record<StatusLevel, string[]> = {
  'muuuito-mal':   ['cansaço', 'sobrecarga', 'inquietação', 'reflexão',    'curiosidade', 'nostalgia', 'surpresa', 'contemplação', 'alívio',    'clareza'],
  'mal':           ['cansaço', 'sobrecarga', 'inquietação', 'curiosidade', 'reflexão',    'nostalgia', 'surpresa', 'contemplação', 'clareza',   'alívio'],
  'mais-ou-menos': ['cansaço', 'curiosidade', 'reflexão',  'contemplação', 'surpresa',    'nostalgia', 'clareza',  'inquietação',  'sobrecarga', 'alívio'],
  'bem':           ['curiosidade', 'clareza', 'reflexão',  'contemplação', 'surpresa',    'nostalgia', 'alívio',   'cansaço',      'inquietação', 'sobrecarga'],
  'muuuito-bem':   ['curiosidade', 'contemplação', 'surpresa', 'clareza',  'reflexão',    'nostalgia', 'alívio',   'cansaço',      'inquietação', 'sobrecarga'],
};

export const ZONES = [
  { label: 'Autopiedade', range: [0, 15], type: 'danger' as const },
  { label: 'Autocompaixão', range: [15, 35], type: 'safe' as const },
  { label: 'Equilíbrio', range: [35, 65], type: 'neutral' as const },
  { label: 'Autorresponsabilidade', range: [65, 85], type: 'safe' as const },
  { label: 'Autoflagelo', range: [85, 100], type: 'danger' as const },
];

export const PERIOD_CONFIG: Record<DayPeriod, { label: string; icon: string }> = {
  morning: { label: 'Manhã', icon: 'Sunrise' },
  afternoon: { label: 'Tarde', icon: 'Sun' },
  night: { label: 'Noite', icon: 'Moon' },
};

export function getZone(position: number) {
  return ZONES.find(z => position >= z.range[0] && position <= z.range[1]) || ZONES[2];
}

export function getZoneLabel(position: number): string {
  if (position >= 12 && position < 22) return 'Entre Autopiedade e\u00A0Autocompaixão';
  if (position >= 30 && position < 40) return 'Entre Autocompaixão e\u00A0Equilíbrio';
  if (position >= 60 && position < 70) return 'Entre Equilíbrio e\u00A0Autorresponsabilidade';
  if (position >= 80 && position < 90) return 'Entre Autorresponsabilidade e\u00A0Autoflagelo';

  const zone = getZone(position);
  return zone.label;
}

export function getCurrentPeriod(): DayPeriod {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
}

export function saveEntry(entry: PendulumEntry) {
  const entries = getEntries();
  const period = entry.period || getCurrentPeriod();
  const entryWithPeriod = { ...entry, period, timestamp: new Date().toISOString() };

  const existingIdx = entries.findIndex(e => e.date === entry.date && e.period === period);
  if (existingIdx >= 0) {
    entries[existingIdx] = entryWithPeriod;
  } else {
    entries.push(entryWithPeriod);
  }
  localStorage.setItem('pendly-entries', JSON.stringify(entries));
}

// Sempre adiciona um novo registro (sem deduplicação por período)
export function addEntry(entry: Omit<PendulumEntry, 'timestamp'>) {
  const entries = getEntries();
  entries.push({ ...entry, timestamp: new Date().toISOString() });
  localStorage.setItem('pendly-entries', JSON.stringify(entries));
}

export function deleteEntry(timestamp: string) {
  const entries = getEntries().filter(e => e.timestamp !== timestamp);
  localStorage.setItem('pendly-entries', JSON.stringify(entries));
}

export function updateEntryNote(timestamp: string, note: string) {
  const entries = getEntries().map(e =>
    e.timestamp === timestamp ? { ...e, note } : e
  );
  localStorage.setItem('pendly-entries', JSON.stringify(entries));
}

export function getEntries(): PendulumEntry[] {
  try {
    return JSON.parse(localStorage.getItem('pendly-entries') || '[]');
  } catch {
    return [];
  }
}

export function getEntriesForDate(date: string): PendulumEntry[] {
  return getEntries().filter(e => e.date === date);
}

export function getAveragePosition(entries: PendulumEntry[]): number {
  if (entries.length === 0) return 50;
  return Math.round(entries.reduce((sum, e) => sum + e.position, 0) / entries.length);
}

export function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayKey(): string {
  return getLocalDateKey();
}

export function getBobColor(position: number): string {
  const dist = Math.abs(position - 50);
  if (dist <= 15) return `hsl(152, 38%, 42%)`;
  if (dist <= 35) {
    const t = (dist - 15) / 20;
    return `hsl(${152 - t * 112}, ${38 + t * 20}%, ${42 + t * 6}%)`;
  }
  if (dist <= 43) {
    const t = (dist - 35) / 8;
    return `hsl(${40 - t * 18}, ${58 + t * 15}%, ${48 - t * 6}%)`;
  }
  const t = (dist - 43) / 7;
  return `hsl(${22 - t * 14}, ${73 + t * 10}%, ${42 - t * 4}%)`;
}

// Intervention content based on position
export interface Intervention {
  reflection: string;
  prompt: string;
  action: string;
  options: string[];
}

export function getIntervention(position: number): Intervention {
  if (position < 20) {
    return {
      reflection: 'Parece que você está sentindo que nada está no seu controle. Isso é válido — mas nem sempre reflete a realidade.',
      prompt: 'Qual é uma pequena coisa que você fez bem hoje?',
      action: 'Escreva uma coisa que você pode controlar amanhã.',
      options: ['Fiz algo gentil por alguém', 'Completei uma tarefa', 'Cuidei de mim', 'Não consigo pensar em nada'],
    };
  }
  if (position < 35) {
    return {
      reflection: 'Você está sendo gentil consigo mesmo. Isso é saudável — apenas observe se não está evitando responsabilidades.',
      prompt: 'Existe algo que você poderia fazer diferente, sem se culpar?',
      action: 'Escolha uma ação pequena para amanhã.',
      options: ['Sim, posso ajustar algo', 'Estou no caminho certo', 'Preciso pensar mais', 'Não tenho certeza'],
    };
  }
  if (position <= 65) {
    return {
      reflection: 'Você parece estar em equilíbrio. Continue observando seus padrões.',
      prompt: 'O que ajudou você a chegar nesse ponto hoje?',
      action: 'Anote o que funcionou para manter esse equilíbrio.',
      options: ['Descansei bem', 'Tive boas conversas', 'Foquei no presente', 'Não sei explicar'],
    };
  }
  if (position <= 85) {
    return {
      reflection: 'Você está assumindo responsabilidade — ótimo. Mas cuidado para não carregar peso demais.',
      prompt: 'Você está sendo justo consigo mesmo?',
      action: 'Permita-se descansar sem culpa por 15 minutos.',
      options: ['Sim, estou sendo justo', 'Talvez esteja exagerando', 'Preciso de ajuda', 'Estou bem assim'],
    };
  }
  return {
    reflection: 'Parece que você está sendo muito duro consigo mesmo. Errar é humano — e não define quem você é.',
    prompt: 'O que você diria a um amigo na mesma situação?',
    action: 'Diga uma frase gentil para si mesmo em voz alta.',
    options: ['Eu mereço compaixão', 'Todo mundo erra', 'Estou fazendo o meu melhor', 'É difícil ser gentil comigo'],
  };
}

// Daily randomized intervention content
export interface InterventionContent {
  reflection: string;
  question: string;
  options: string[];
  action: string;
}

function getDailySeed(dateKey: string, zoneIndex: number): number {
  const str = `${dateKey}-z${zoneIndex}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getZoneIndex(position: number): number {
  if (position < 20) return 0;
  if (position < 35) return 1;
  if (position <= 65) return 2;
  if (position <= 85) return 3;
  return 4;
}

const ZONE_INTERVENTIONS: Record<number, InterventionContent[]> = {
  0: [ // Autopiedade (< 20)
    {
      reflection: "Parece que hoje tá pesado, hein? Às vezes a gente se sente completamente à deriva — e tudo bem reconhecer isso.",
      question: "O que você acha que te trouxe até esse lugar hoje?",
      options: ["Sinto que não consigo cuidar nem de mim", "Me sinto completamente travado(a)", "Estou me sentindo sozinho(a) nisso tudo", "Não sei bem o que sinto"],
      action: "Amanhã, tente nomear uma coisa pequena que foi boa — por menor que seja.",
    },
    {
      reflection: "Quando a gente se sente assim, é fácil achar que nada vai mudar. Mas você já teve essa sensação antes e passou, lembra?",
      question: "Tem alguma coisa específica que aconteceu e te fez sentir assim?",
      options: ["Tive um dia muito difícil", "As coisas foram acumulando até explodir", "Estou exausto(a) por dentro", "Sinto que estou falhando"],
      action: "Antes de dormir, coloque a mão no peito por um momento. Só isso.",
    },
    {
      reflection: "Às vezes carregar tudo sozinho cansa demais. Não precisa ter resposta pra tudo agora.",
      question: "O que você mais precisaria agora — acolhimento, clareza, ou só um respiro?",
      options: ["Precisaria de mais acolhimento", "Quero ter mais clareza", "Só preciso descansar", "Estou evitando sentir algo"],
      action: "Escolha uma coisa que você pode largar hoje. Só uma.",
    },
  ],
  1: [ // Autocompaixão (20-35)
    {
      reflection: "Que bom que você está sendo gentil consigo mesmo hoje. Isso não é fácil — e você está conseguindo.",
      question: "O que te ajudou a chegar nesse lugar de cuidado? Foi algo que você fez ou percebeu?",
      options: ["Decidi descansar mais hoje", "Conversei com alguém importante", "Percebi que estava me cobrando demais", "Aconteceu naturalmente, sem forçar"],
      action: "Registre mentalmente o que te trouxe até aqui. Vai ser útil quando vier um dia difícil.",
    },
    {
      reflection: "Você está num lugar bacana — conseguindo se ver sem tanto julgamento. Isso tem um valor real.",
      question: "Essa gentileza consigo mesmo... você sente que às vezes exagera nela pra evitar encarar algo?",
      options: ["Não, está equilibrado", "Talvez sim, pode ser", "Acho que estou evitando algo mesmo", "Não tinha pensado nisso antes"],
      action: "Observe se a gentileza de hoje está te cuidando ou te protegendo de algo que precisa ser encarado.",
    },
    {
      reflection: "Cuidar de si mesmo sem se culpar é uma habilidade que muita gente não tem. Parece que você está nesse caminho hoje.",
      question: "Tem alguma coisa que você está adiando enquanto cuida de si?",
      options: ["Sim, tenho algo pra resolver", "Não, estou em dia com tudo", "Talvez, mas preciso de energia primeiro", "Não sei identificar agora"],
      action: "Se tem algo adiado, escreva só o primeiro passo — bem pequeno. Só isso.",
    },
  ],
  2: [ // Equilíbrio (35-65)
    {
      reflection: "Parece que você está num bom ponto hoje. Nem demais pra um lado, nem pro outro.",
      question: "O que você acha que mais contribuiu pra você estar assim hoje?",
      options: ["Dormi bem e descansado(a)", "Tive boas conversas", "Foquei no que importava", "Não sei ao certo, mas estou bem"],
      action: "Anote, mesmo que mentalmente, o que funcionou. Esse equilíbrio tem uma receita.",
    },
    {
      reflection: "Equilíbrio é raro — e você está nele agora. Vale parar um segundo pra notar isso.",
      question: "Quando você não está nesse ponto, o que costuma te tirar dele?",
      options: ["Trabalho ou pressão externa", "Relacionamentos e expectativas", "Minha própria autocrítica", "Coisas que fogem do meu controle"],
      action: "Identifique o que te desequilibra. Conhecer o gatilho é metade do caminho.",
    },
    {
      reflection: "Tá bem por aqui hoje, parece. Às vezes o equilíbrio vem sem a gente perceber.",
      question: "Tem algo que você fez conscientemente hoje pra manter esse estado?",
      options: ["Sim, tomei uma decisão específica", "Fiz algo pra me cuidar", "Evitei algo que me drena", "Foi orgânico mesmo"],
      action: "Continue fazendo o que te trouxe até aqui. Simples assim.",
    },
  ],
  3: [ // Autorresponsabilidade (65-85)
    {
      reflection: "Você está assumindo as rédeas. Isso é ótimo — mas existe uma linha tênue entre responsabilidade e perfeccionismo.",
      question: "Você está sendo exigente consigo por quê — porque quer crescer, ou porque sente que precisa se provar?",
      options: ["Quero crescer de verdade", "Sinto que preciso me provar", "Um pouco dos dois", "Não sei distinguir agora"],
      action: "Permita-se descansar por 15 minutos sem se justificar. Responsabilidade inclui cuidar de quem executa.",
    },
    {
      reflection: "Tô vendo que você está se cobrando bastante hoje. Isso vem de um lugar de cuidado ou de pressão?",
      question: "O que acontece dentro de você quando você não cumpre tudo que planejou?",
      options: ["Sinto culpa pesada", "Fico frustrado(a) mas sigo em frente", "Me cobro muito e demoro pra soltar", "Analiso e ajusto sem me punir"],
      action: "Escolha uma coisa da lista que pode ir pro amanhã. Delegar pra si mesmo também é válido.",
    },
    {
      reflection: "Responsabilidade é poderosa. Mas às vezes a gente exige tanto de si que esquece que também é humano.",
      question: "Tem algo que você está se cobrando hoje que poderia ver com mais leveza?",
      options: ["Sim, tem algo que posso soltar", "Não, está tudo dentro do razoável", "Talvez, mas é difícil largar", "Não tinha pensado nisso assim"],
      action: "Diga em voz alta: 'Eu posso fazer menos hoje e ainda estar bem.' Pode parecer estranho — tente assim mesmo.",
    },
  ],
  4: [ // Autoflagelo (> 85)
    {
      reflection: "Parece que você foi bem duro(a) consigo hoje. E eu quero entender de onde vem isso.",
      question: "O que aconteceu pra você se sentir merecedor(a) de tanta crítica?",
      options: ["Cometi um erro que me afetou muito", "Não me sinto bom(boa) o suficiente", "Alguém me fez sentir assim", "Não sei identificar a origem"],
      action: "Diga uma frase gentil pra si mesmo em voz alta. Uma frase só. Pode ser difícil — esse é o ponto.",
    },
    {
      reflection: "Às vezes a gente fica tão acostumado a se punir que nem percebe mais que está fazendo isso.",
      question: "Se um amigo próximo te contasse que se sente assim sobre si mesmo... o que você diria a ele?",
      options: ["Diria que ele é muito mais do que os erros dele", "Ouviria sem julgamento", "Diria que todo mundo erra", "Não saberia o que dizer"],
      action: "Escreva o que você diria ao amigo — e leia como se fosse pra você.",
    },
    {
      reflection: "Você está muito duro(a) consigo agora. Isso me diz que algo te afetou de verdade hoje.",
      question: "Você consegue separar o que você fez do que você é?",
      options: ["Sim, consigo ver essa diferença", "Às vezes confundo as duas coisas", "É difícil não me definir pelos erros", "Não consigo agora, tá tudo misturado"],
      action: "Um erro não define quem você é. Amanhã você terá outra chance — e você vai estar aqui pra aproveitá-la.",
    },
  ],
};

export function getDailyIntervention(position: number, dateKey: string = getTodayKey()): InterventionContent {
  const zoneIndex = getZoneIndex(position);
  const variants = ZONE_INTERVENTIONS[zoneIndex];
  const seed = getDailySeed(dateKey, zoneIndex);
  return variants[seed % variants.length];
}
