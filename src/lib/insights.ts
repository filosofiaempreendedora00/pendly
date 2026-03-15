import type { StatusLevel } from './pendulum';

// ─── Tipos ───────────────────────────────────────────────────────────────────
type TimeContext = 'morning' | 'afternoon' | 'night';
type Mode = 'negative' | 'neutral' | 'positive';

export interface InsightInput {
  statusLevel: StatusLevel;
  position: number;
  emotions: string[];
  note?: string;
}

export interface InsightMessage {
  line1: string;
  line2: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTimeContext = (): TimeContext => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
};

const getMode = (statusLevel: StatusLevel): Mode => {
  if (statusLevel === 'mais-ou-menos') return 'neutral';
  if (statusLevel === 'bem' || statusLevel === 'muuuito-bem') return 'positive';
  return 'negative';
};

// Intensidade: 1 = baixa, 2 = média, 3 = alta
const getIntensity = (position: number): number => {
  const dist = Math.abs(position - 50);
  if (dist <= 12) return 1;
  if (dist <= 28) return 2;
  return 3;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const formatEmotions = (emotions: string[]): string => {
  if (emotions.length === 0) return 'esse sentimento';
  if (emotions.length === 1) return emotions[0];
  if (emotions.length === 2) return `${emotions[0]} e ${emotions[1]}`;
  return `${emotions[0]}, ${emotions[1]} e ${emotions[2]}`;
};

// Concordância verbal baseada no número de emoções
const pl = (emotions: string[], singular: string, plural: string) =>
  emotions.length === 1 ? singular : plural;

// Seleção pseudo-aleatória mas estável dentro da sessão
const pick = <T>(arr: T[], seed: number): T => arr[Math.abs(seed) % arr.length];

// ─── Geração de insight ───────────────────────────────────────────────────────
// Tom de voz: conversacional, informal sem ser coloquial.
// Usar "pra/pro" em vez de "para", "nessa/dessa" em vez de "nesta/desta".
export const generateInsight = (input: InsightInput): InsightMessage => {
  const { statusLevel, position, emotions, note } = input;
  const mode      = getMode(statusLevel);
  const time      = getTimeContext();
  const intensity = getIntensity(position);
  const em        = formatEmotions(emotions);
  const em1       = emotions[0] ?? 'esse sentimento';
  const hasNote   = !!note && note.trim().length > 0;
  const seed      = emotions.length * 7 + Math.floor(position / 11);

  // ── NEGATIVO ──────────────────────────────────────────────────────────────
  if (mode === 'negative') {
    let line1: string;

    if (hasNote) {
      const opts = intensity >= 3
        ? [
            'Pelo que você escreveu, parece que algo pesou bastante hoje.',
            'Isso que você viveu claramente tocou em algo muito importante.',
            'Esse momento parece ter sido realmente difícil — é natural sentir isso.',
          ]
        : [
            'Pelo que você registrou, parece que algo incomodou um pouco hoje.',
            'Algo que você mencionou parece estar ocupando sua cabeça agora.',
            'Faz sentido que o que você descreveu tenha mexido com você.',
          ];
      line1 = pick(opts, seed);
    } else {
      const opts = intensity >= 3
        ? [
            `Parece que ${em} ${pl(emotions, 'chegou', 'chegaram')} forte nesse momento.`,
            `${cap(em1)} e esse peso — faz sentido que seja difícil agora.`,
            `Parece que ${em} ${pl(emotions, 'está pesando', 'estão pesando')} bastante nesse momento.`,
          ]
        : [
            `Parece que ${em} ${pl(emotions, 'apareceu', 'apareceram')} por aqui hoje.`,
            `${cap(em1)} pode incomodar, mesmo que pareça algo pequeno.`,
            `Parece que ${em} ${pl(emotions, 'está presente', 'estão presentes')} agora.`,
          ];
      line1 = pick(opts, seed);
    }

    const line2Opts = {
      morning: [
        'O dia ainda está começando — esse momento não precisa definir as horas que vêm.',
        'O que precisaria mudar só um pouco pra manhã seguir de um jeito diferente?',
        'Será que esse sentimento consegue mesmo definir o resto do seu dia?',
      ],
      afternoon: [
        'Tem algo pequeno que ainda está no seu controle agora?',
        'Às vezes uma pausa de dois minutos já muda a perspectiva do resto da tarde.',
        'O que você pode fazer agora, por menor que seja, pra se reencontrar um pouco?',
      ],
      night: [
        'Um dia difícil não define quem você é — o que esse momento revela sobre o que importa pra você?',
        'O que você aprendeu sobre si mesmo com o que aconteceu hoje?',
        'Você chegou até aqui. O que foi necessário pra isso?',
      ],
    };

    return { line1, line2: pick(line2Opts[time], seed) };
  }

  // ── NEUTRO ────────────────────────────────────────────────────────────────
  if (mode === 'neutral') {
    const line1Opts = hasNote
      ? [
          'Parece que você está num momento mais de observação do que de extremos.',
          'Às vezes o "mais ou menos" esconde mais do que parece à primeira vista.',
          'Estar no meio pode ser um espaço de clareza — ou de dúvida ainda não resolvida.',
        ]
      : [
          `Parece que hoje está mais neutro pra você.`,
          `Um dia no meio-termo — nem muito pesado, nem muito leve.`,
          `Esse "mais ou menos" às vezes pede um olhar mais atento.`,
        ];

    const line2Opts = {
      morning: [
        'Houve algo pequeno essa manhã que poderia tornar o dia um pouco mais seu?',
        'O que você mais precisa hoje pra sair desse neutro?',
      ],
      afternoon: [
        'Houve algo pequeno que poderia tornar essa tarde um pouco melhor?',
        'O que faria a segunda metade desse dia ser um pouco mais satisfatória?',
      ],
      night: [
        'Olhando pro dia, houve algum momento que foi melhor do que os outros?',
        'O que tornaria amanhã um pouco diferente desse dia?',
      ],
    };

    return { line1: pick(line1Opts, seed), line2: pick(line2Opts[time], seed) };
  }

  // ── POSITIVO ──────────────────────────────────────────────────────────────
  let line1: string;

  if (hasNote) {
    const opts = intensity >= 3
      ? [
          'O que você registrou hoje reflete algo genuinamente especial.',
          'Esse momento que você descreveu merece ser guardado com cuidado.',
        ]
      : [
          'Pelo que você escreveu, parece que algo bom aconteceu hoje.',
          'Parece que algo do que você viveu ficou com você de um jeito positivo.',
        ];
    line1 = pick(opts, seed);
  } else {
    const opts = intensity >= 3
      ? [
          `Momentos de ${em1} com essa intensidade são raros — vale notar.`,
          `Que bom que ${em} chegaram por aqui hoje.`,
          `${cap(em1)} com essa força merece atenção e reconhecimento.`,
        ]
      : [
          `Que bom ver ${em} por aqui.`,
          `Parece que ${em} estão presentes agora — isso é bom notar.`,
          `Momentos de ${em1} são valiosos e merecem ser reconhecidos.`,
        ];
    line1 = pick(opts, seed);
  }

  const line2Opts = {
    morning: [
      'Você consegue identificar o que ajudou a trazer esse sentimento tão cedo?',
      'O que dessa manhã você quer levar pro resto do dia?',
    ],
    afternoon: [
      'Você consegue identificar o que contribuiu pra isso nessa tarde?',
      'Tem algo nesse dia que você quer repetir ou guardar?',
    ],
    night: [
      'O que aconteceu hoje que contribuiu pra esse sentimento?',
      'Que parte desse dia você quer lembrar amanhã?',
    ],
  };

  return { line1, line2: pick(line2Opts[time], seed) };
};
