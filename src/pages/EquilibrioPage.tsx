import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { getEntries } from '@/lib/pendulum';

/* ── Types ──────────────────────────────────────────────────────────────────── */
type FocusArea   = 'past' | 'future';
type AnswerType  = 'balanced' | 'neutral' | 'ruminative';
type Phase       = 'loading' | 'gated' | 'entry' | 'session' | 'complete';

interface SessionCtx {
  position: number;
  emotions: string[];
  note?: string;
}
interface AnglePack {
  key: string;
  question: (ctx: SessionCtx) => string;
  options: { text: string; type: AnswerType }[];
}
interface Turn {
  validation: string;
  question: string;
  options: { text: string; type: AnswerType }[];
  angleKey: string;
}
interface TurnResult {
  angleKey: string;
  type: AnswerType;
}

/* ── Gate: require check-in within 60 min ───────────────────────────────────── */
function getRecentEntry(): SessionCtx | null {
  const entries = getEntries();
  if (!entries.length) return null;
  const sorted = [...entries]
    .filter(e => e.timestamp)
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  if (!sorted.length) return null;
  const latest  = sorted[0];
  const ageMins = (Date.now() - new Date(latest.timestamp!).getTime()) / 60000;
  if (ageMins > 60) return null;
  return { position: latest.position, emotions: latest.emotions ?? [], note: latest.note };
}

/* ── Movement constants ─────────────────────────────────────────────────────── */
const START_X: Record<FocusArea, number> = { past: -140, future: 140 };
const COMPLETE_THRESH  = 20;
const STEP_BALANCED    = 38;
const STEP_RUMINATIVE  = 18;
const MAX_ABS          = 162;

/* ── Validation phrases (shown above next question) ─────────────────────────── */
const VAL: Record<AnswerType, string[]> = {
  balanced:   ['Boa perspectiva.', 'Você está chegando mais perto.', 'Isso ajuda a ver com mais clareza.', 'Faz sentido ver assim.', 'Você está se encontrando.'],
  neutral:    ['É normal não ter certeza ainda.', 'Estar no meio também é honesto.', 'Isso é difícil de definir — e tudo bem.', 'Você está olhando pra isso com cuidado.', 'Faz sentido estar num lugar de incerteza.'],
  ruminative: ['Faz sentido que seja difícil soltar.', 'Essas coisas têm peso real.', 'É válido sentir assim.', 'Isso claramente importa muito pra você.', 'Às vezes é difícil sair desse lugar.'],
};
const pickVal = (type: AnswerType, idx: number) => VAL[type][idx % VAL[type].length];

/* ── Question banks ─────────────────────────────────────────────────────────── */

const PAST_ANGLES: AnglePack[] = [
  {
    key: 'presence',
    question: () => 'Esse episódio ainda está ativo na sua vida agora — ou só na sua cabeça?',
    options: [
      { text: 'Está totalmente presente, afeta tudo',        type: 'ruminative' },
      { text: 'Um pouco dos dois',                           type: 'neutral'    },
      { text: 'Principalmente na minha cabeça',              type: 'balanced'   },
    ],
  },
  {
    key: 'clarity',
    question: ({ emotions }) =>
      emotions.includes('culpa') || emotions.includes('vergonha')
        ? 'O que você está revisitando — é o que aconteceu, ou o que isso diz sobre você?'
        : 'Isso que você revive — é o fato em si, ou a interpretação que você fez?',
    options: [
      { text: 'É exatamente o que aconteceu — tenho certeza',       type: 'ruminative' },
      { text: 'Não consigo separar bem agora',                       type: 'neutral'    },
      { text: 'Talvez esteja interpretando além do que foi',         type: 'balanced'   },
    ],
  },
  {
    key: 'control',
    question: () => 'O que, nessa situação, ainda está dentro da sua capacidade de mudar?',
    options: [
      { text: 'Nada — já passou, está fora do meu alcance',          type: 'ruminative' },
      { text: 'Talvez algo, mas não sei identificar',                 type: 'neutral'    },
      { text: 'Posso mudar minha relação com o que aconteceu',       type: 'balanced'   },
    ],
  },
  {
    key: 'weight',
    question: () => 'Continuar carregando isso — o que isso te dá?',
    options: [
      { text: 'Me protege de cometer o mesmo erro de novo',          type: 'ruminative' },
      { text: 'Não sei bem por que ainda fico nisso',                 type: 'neutral'    },
      { text: 'Honestamente, não me dá nada de útil',                type: 'balanced'   },
    ],
  },
  {
    key: 'identity',
    question: ({ emotions }) =>
      emotions.includes('vergonha') || emotions.includes('culpa')
        ? 'Isso que aconteceu fala sobre quem você é — ou sobre o que você fez naquele momento?'
        : 'Você está se definindo por esse episódio, ou só aprendendo com ele?',
    options: [
      { text: 'Esse evento diz muito sobre quem eu sou',             type: 'ruminative' },
      { text: 'Às vezes confundo uma coisa com a outra',             type: 'neutral'    },
      { text: 'Foi algo que aconteceu — não é quem eu sou',         type: 'balanced'   },
    ],
  },
  {
    key: 'compassion',
    question: () => 'Se um amigo próximo tivesse passado pelo mesmo — você veria da mesma forma?',
    options: [
      { text: 'Sim, seria igualmente rigoroso com ele',              type: 'ruminative' },
      { text: 'Talvez fosse um pouco mais gentil',                   type: 'neutral'    },
      { text: 'Com certeza seria muito mais compreensivo',           type: 'balanced'   },
    ],
  },
  {
    key: 'today',
    question: () => 'Hoje, agora — quanto espaço esse episódio ocupa na sua atenção?',
    options: [
      { text: 'Grande parte do meu foco está nisso',                 type: 'ruminative' },
      { text: 'Aparece de vez em quando',                            type: 'neutral'    },
      { text: 'Menos do que antes — consigo focar em outras coisas', type: 'balanced'   },
    ],
  },
  {
    key: 'learning',
    question: () => 'Há algo que essa situação te ensinou que você não teria aprendido sem ela?',
    options: [
      { text: 'Não — só foi prejudicial',                            type: 'ruminative' },
      { text: 'Talvez sim, mas preferia não ter passado por isso',   type: 'neutral'    },
      { text: 'Sim, tem algo que ainda carrego com utilidade',       type: 'balanced'   },
    ],
  },
];

const FUTURE_ANGLES: AnglePack[] = [
  {
    key: 'present',
    question: () => 'Agora, neste exato momento — esse problema existe de fato, ou ainda é uma projeção?',
    options: [
      { text: 'Está presente agora, é muito real',                   type: 'ruminative' },
      { text: 'Tem um fundo real, mas é amplificado',                type: 'neutral'    },
      { text: 'Ainda não aconteceu — é uma antecipação',             type: 'balanced'   },
    ],
  },
  {
    key: 'probability',
    question: ({ emotions }) =>
      emotions.some(e => ['ansiedade', 'pânico', 'medo'].includes(e))
        ? 'Esse medo — quão provável é que o pior cenário realmente aconteça?'
        : 'O que você teme — é provável, ou é um cenário que sua mente está amplificando?',
    options: [
      { text: 'Estou convicto de que vai acontecer',                 type: 'ruminative' },
      { text: 'Não sei estimar — pode ser qualquer coisa',           type: 'neutral'    },
      { text: 'Provavelmente menos provável do que parece',          type: 'balanced'   },
    ],
  },
  {
    key: 'control',
    question: () => 'Do que você está preocupado — o que está realmente dentro da sua influência?',
    options: [
      { text: 'Quase nada — depende de fatores externos',            type: 'ruminative' },
      { text: 'Algumas coisas, mas não as mais importantes',         type: 'neutral'    },
      { text: 'Mais do que parece quando estou ansioso',             type: 'balanced'   },
    ],
  },
  {
    key: 'cost',
    question: () => 'Ficar preocupado com isso agora — te ajuda a se preparar, ou só consome energia?',
    options: [
      { text: 'Me ajuda a me preparar melhor',                       type: 'ruminative' },
      { text: 'Um pouco dos dois',                                   type: 'neutral'    },
      { text: 'Honestamente, só está me consumindo',                 type: 'balanced'   },
    ],
  },
  {
    key: 'capacity',
    question: () => 'Se esse cenário acontecesse — você encontraria um jeito de lidar?',
    options: [
      { text: 'Não, seria devastador',                               type: 'ruminative' },
      { text: 'Talvez sim, mas seria muito difícil',                 type: 'neutral'    },
      { text: 'Já enfrentei coisas difíceis — encontraria um caminho', type: 'balanced' },
    ],
  },
  {
    key: 'action',
    question: () => 'Existe algo concreto que você poderia fazer hoje pra reduzir essa incerteza?',
    options: [
      { text: 'Não há nada que resolva antes de acontecer',          type: 'ruminative' },
      { text: 'Tem algo, mas não estou pronto ainda',                type: 'neutral'    },
      { text: 'Sim, existe um próximo passo que eu poderia dar',     type: 'balanced'   },
    ],
  },
  {
    key: 'origin',
    question: ({ emotions }) =>
      emotions.includes('insegurança')
        ? 'Essa insegurança sobre o futuro — onde você acha que ela tem raiz?'
        : 'Essa preocupação fala mais sobre o que pode acontecer — ou sobre o que você acredita de si mesmo?',
    options: [
      { text: 'É sobre o que pode acontecer lá fora',                type: 'ruminative' },
      { text: 'Não sei distinguir bem agora',                        type: 'neutral'    },
      { text: 'Tem algo sobre o que eu acredito de mim mesmo',       type: 'balanced'   },
    ],
  },
  {
    key: 'anchor',
    question: () => 'O que na sua vida agora — independente dessa preocupação — está funcionando?',
    options: [
      { text: 'Difícil enxergar isso agora',                         type: 'ruminative' },
      { text: 'Algumas coisas pequenas',                             type: 'neutral'    },
      { text: 'Tem coisas sólidas aqui que posso me apoiar',         type: 'balanced'   },
    ],
  },
];

/* ── Phase-based angle ordering (early → stabilize, mid → reflect, late → ground) */
const PHASES: Record<FocusArea, string[][]> = {
  past:   [['presence', 'clarity'], ['control', 'weight', 'today'], ['identity', 'compassion', 'learning']],
  future: [['present', 'probability'], ['control', 'cost', 'action'], ['capacity', 'origin', 'anchor']],
};

function selectAngle(focusArea: FocusArea, usedKeys: string[], turns: TurnResult[]): AnglePack {
  const pool     = focusArea === 'past' ? PAST_ANGLES : FUTURE_ANGLES;
  const phaseIdx = turns.length < 3 ? 0 : turns.length < 7 ? 1 : 2;
  const phases   = PHASES[focusArea];

  // If user is struggling (2 ruminative in a row) → ease in with soft angle
  const lastTwo = turns.slice(-2);
  if (lastTwo.length === 2 && lastTwo.every(t => t.type === 'ruminative')) {
    const softKeys = focusArea === 'past' ? ['compassion', 'learning'] : ['capacity', 'anchor'];
    const soft = pool.find(a => softKeys.includes(a.key) && !usedKeys.includes(a.key));
    if (soft) return soft;
  }

  // Phase-preferred
  const phaseKeys      = phases[phaseIdx];
  const phaseCandidates = pool.filter(a => phaseKeys.includes(a.key) && !usedKeys.includes(a.key));
  if (phaseCandidates.length > 0) return phaseCandidates[0];

  // Any unused
  const unused = pool.filter(a => !usedKeys.includes(a.key));
  if (unused.length > 0) return unused[0];

  // Recycle: avoid only the immediately previous angle so we never loop on the same one
  const lastKey = usedKeys[usedKeys.length - 1];
  return pool.find(a => a.key !== lastKey) ?? pool[0];
}

function buildTurn(focusArea: FocusArea, turns: TurnResult[], usedKeys: string[], ctx: SessionCtx): Turn {
  const pool = focusArea === 'past' ? PAST_ANGLES : FUTURE_ANGLES;
  // Rolling window: only block the last (pool.length - 1) angles so older ones cycle back in
  const rollingUsed = usedKeys.slice(-(pool.length - 1));
  const angle = selectAngle(focusArea, rollingUsed, turns);
  const lastTurn  = turns[turns.length - 1];
  const validation = lastTurn
    ? pickVal(lastTurn.type, turns.filter(t => t.type === lastTurn.type).length - 1)
    : '';

  // Shuffle options so order is never predictable
  const shuffled = [...angle.options].sort(() => Math.random() - 0.5);

  return { validation, question: angle.question(ctx), options: shuffled, angleKey: angle.key };
}

/* ── Axis — defined OUTSIDE parent so React never remounts it ────────────────── */
interface AxisProps { dotX: number; dotVisible: boolean; done: boolean; }

const AxisTrack = ({ dotX, dotVisible, done }: AxisProps) => (
  <div className="relative w-full flex items-center justify-center" style={{ height: 72 }}>
    <div className="absolute" style={{ left: 16, right: 16, height: 1, background: 'rgba(255,255,255,0.28)' }} />

    {done && [0, 180, 360].map(d => (
      <div key={d} className="celebration-ring" style={{ animationDelay: `${d}ms` }} />
    ))}

    {/* Centre marker */}
    <div
      className="absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-500"
      style={{
        width:      done ? 10 : 8,
        height:     done ? 10 : 8,
        marginLeft: done ? -5 : -4,
        background: done ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)',
        boxShadow:  done ? '0 0 0 5px rgba(255,255,255,0.10)' : 'none',
      }}
    />

    {/* Moving dot — CSS transition animates because this element is NEVER remounted */}
    <div
      className={`absolute left-1/2 rounded-full shadow-lg ${done ? 'axis-dot-glow-dark' : ''}`}
      style={{
        width:      done ? 26 : 20,
        height:     done ? 26 : 20,
        marginLeft: done ? -13 : -10,
        background: '#fff',
        opacity:    dotVisible ? 1 : 0,
        transform:  `translateX(${dotX}px)`,
        transition: dotVisible
          ? 'transform 1100ms cubic-bezier(0.76, 0, 0.24, 1), opacity 350ms ease, width 400ms ease, height 400ms ease, margin-left 400ms ease'
          : 'opacity 350ms ease',
      }}
    />

    {/* Labels */}
    {(['past', 'present', 'future'] as const).map(z => {
      const offset = z === 'past' ? START_X.past : z === 'future' ? START_X.future : 0;
      const label  = z === 'past' ? 'Passado' : z === 'future' ? 'Futuro' : 'Presente';
      const isNow  = z === 'present';
      return (
        <span
          key={z}
          className="absolute"
          style={{
            left:          '50%',
            top:           'calc(50% + 22px)',
            transform:     `translateX(calc(-50% + ${offset}px))`,
            fontSize:      9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace:    'nowrap',
            color:      isNow ? (done ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.55)') : 'rgba(255,255,255,0.50)',
            fontWeight: isNow && done ? 700 : 400,
            transition: 'color 0.5s',
          }}
        >
          {label}
        </span>
      );
    })}
  </div>
);

/* ── Helpers ─────────────────────────────────────────────────────────────────── */
const BG: React.CSSProperties = {
  background: 'linear-gradient(155deg, #0b1728 0%, #0d2040 50%, #101e4a 100%)',
};
const haptic = (p: number | number[]) => navigator.vibrate?.(p);

/* ══════════════════════════════════════════════════════════════════════════════
   EquilibrioPage
══════════════════════════════════════════════════════════════════════════════ */
const EquilibrioPage = () => {
  const navigate = useNavigate();

  const [phase,      setPhase]      = useState<Phase>('loading');
  const [ctx,        setCtx]        = useState<SessionCtx>({ position: 50, emotions: [] });
  const [focusArea,  setFocusArea]  = useState<FocusArea>('past');
  const [dotX,       setDotX]       = useState(0);
  const [dotVisible, setDotVisible] = useState(false);
  const [turns,      setTurns]      = useState<TurnResult[]>([]);
  const [usedKeys,   setUsedKeys]   = useState<string[]>([]);
  const [curTurn,    setCurTurn]    = useState<Turn | null>(null);
  const [fading,     setFading]     = useState(false);

  useEffect(() => {
    const entry = getRecentEntry();
    if (entry) { setCtx(entry); setPhase('entry'); }
    else        { setPhase('gated'); }
  }, []);

  const fade = (cb: () => void) => {
    setFading(true);
    setTimeout(() => { cb(); setFading(false); }, 190);
  };

  /* ── Select focus area (STEP 1) ─────────────────────────────────────────── */
  const onFocusSelect = (area: FocusArea) => {
    haptic(8);
    const firstTurn = buildTurn(area, [], [], ctx);
    fade(() => {
      setFocusArea(area);
      setDotX(START_X[area]);
      setDotVisible(true);
      setCurTurn(firstTurn);
      setUsedKeys([firstTurn.angleKey]);
      setTurns([]);
      setPhase('session');
    });
  };

  /* ── Answer a question ──────────────────────────────────────────────────── */
  const onAnswer = (type: AnswerType) => {
    if (!curTurn) return;
    haptic(8);

    const newTurns: TurnResult[] = [...turns, { angleKey: curTurn.angleKey, type }];

    // Compute new dot position
    let newX = dotX;
    if (type === 'balanced') {
      newX = Math.sign(dotX) * Math.max(0, Math.abs(dotX) - STEP_BALANCED);
    } else if (type === 'ruminative') {
      const sign = dotX !== 0 ? Math.sign(dotX) : (focusArea === 'past' ? -1 : 1);
      newX = sign * Math.min(MAX_ABS, Math.abs(dotX) + STEP_RUMINATIVE);
    }

    const done = Math.abs(newX) <= COMPLETE_THRESH || newTurns.length >= 15;
    if (done) newX = 0;

    const nextTurn = done ? null : buildTurn(focusArea, newTurns, usedKeys, ctx);
    const nextKeys = nextTurn ? [...usedKeys, nextTurn.angleKey] : usedKeys;

    // ── Dot slides IMMEDIATELY (visible, physics transition plays fully) ──
    setDotX(newX);

    // ── Content fades out → swaps → fades in (independent of dot) ────────
    setFading(true);
    setTimeout(() => {
      setTurns(newTurns);
      if (done) {
        setPhase('complete');
        haptic([10, 60, 18]);
      } else if (nextTurn) {
        setCurTurn(nextTurn);
        setUsedKeys(nextKeys);
      }
      setFading(false);
    }, 190);
  };

  /* ── Reset session ──────────────────────────────────────────────────────── */
  const onReset = () => {
    haptic(8);
    setPhase('entry');
    setDotX(0);
    setDotVisible(false);
    setTurns([]);
    setUsedKeys([]);
    setCurTurn(null);
  };

  const done = phase === 'complete';

  /* ── Loading skeleton ───────────────────────────────────────────────────── */
  if (phase === 'loading') return <div style={{ ...BG, minHeight: '100vh' }} />;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col" style={{ ...BG, height: '100dvh' }}>
      <div className="flex flex-col max-w-md mx-auto w-full h-full">

        {/* ── Scrollable content ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-14 pb-4">

          {/* ── Disclaimer ───────────────────────────────────────────────── */}
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3 items-start">
            <span className="text-base shrink-0 mt-px">🚧</span>
            <div>
              <p className="text-[11px] font-bold text-amber-800 mb-0.5 uppercase tracking-wide">Em desenvolvimento</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Esta tela está em construção. Algumas funcionalidades podem mudar ou não funcionar como esperado.
              </p>
            </div>
          </div>

          {/* ── GATED ─────────────────────────────────────────────────────── */}
          {phase === 'gated' && (
            <div className="flex flex-col items-center justify-center" style={{ minHeight: '70vh' }}>
              <div className="text-center mb-10">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  Reequilibre-se
                </h1>
              </div>

              <div
                className="w-full rounded-3xl p-7 text-center"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  <Scale size={22} style={{ color: 'rgba(255,255,255,0.65)' }} strokeWidth={1.6} />
                </div>

                <p className="text-[16px] font-semibold mb-2 leading-snug" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  Um check-in rápido primeiro
                </p>
                <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.48)' }}>
                  Para te ajudar a se reequilibrar, o Equilibre-se precisa saber como você está agora.
                </p>

                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3.5 rounded-2xl text-[14px] font-bold active:scale-[0.98] transition-all duration-150"
                  style={{ background: '#fff', color: '#0d2040' }}
                >
                  Fazer check-in
                </button>
              </div>
            </div>
          )}

          {/* ── ENTRY ─────────────────────────────────────────────────────── */}
          {phase === 'entry' && (
            <>
              {/* Title */}
              <div className="text-center mb-3">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  Reequilibre-se
                </h1>
              </div>

              {/* Mini pendulum */}
              <div className="flex justify-center mb-7">
                <svg
                  width="48"
                  height="76"
                  viewBox="0 0 48 76"
                  style={{ overflow: 'visible', display: 'block' }}
                >
                  <defs>
                    <radialGradient id="eq-bob-grad" cx="42%" cy="38%" r="60%">
                      <stop offset="0%"   stopColor="rgba(195,218,255,0.82)" />
                      <stop offset="55%"  stopColor="rgba(78,128,210,0.88)" />
                      <stop offset="100%" stopColor="rgba(22,58,148,0.94)" />
                    </radialGradient>
                    <filter id="eq-bob-glow" x="-40%" y="-40%" width="180%" height="180%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Pivot dot */}
                  <circle cx="24" cy="0" r="2.5" fill="rgba(255,255,255,0.70)" />
                  {/* Arm — rotates around its own top-center */}
                  <g
                    className="intro-pendulum-arm"
                    style={{ transformBox: 'fill-box', transformOrigin: 'top center' }}
                  >
                    <line x1="24" y1="0" x2="24" y2="58" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" strokeLinecap="round" />
                    <circle cx="24" cy="66" r="9" fill="url(#eq-bob-grad)" filter="url(#eq-bob-glow)" />
                  </g>
                </svg>
              </div>

              <div className={`flex flex-col gap-5 transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                <p className="text-[16px] font-semibold text-center leading-snug px-2" style={{ color: 'rgba(255,255,255,0.80)' }}>
                  O que mais está puxando sua mente agora?
                </p>

                {/* Side-by-side: past LEFT ← → future RIGHT */}
                <div className="flex gap-3 mt-1">
                  {/* Past — left */}
                  <button
                    onClick={() => onFocusSelect('past')}
                    className="flex-1 flex flex-col items-center gap-3 px-3 py-5 rounded-2xl active:scale-[0.97] transition-all duration-150"
                    style={{ border: '1px solid rgba(147,197,253,0.22)', background: 'rgba(147,197,253,0.07)', backdropFilter: 'blur(8px)' }}
                  >
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(147,197,253,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>
                      </svg>
                    </span>
                    <span className="text-[12.5px] font-medium text-center leading-snug" style={{ color: 'rgba(255,255,255,0.80)' }}>
                      Algo que já aconteceu
                    </span>
                  </button>

                  {/* Future — right */}
                  <button
                    onClick={() => onFocusSelect('future')}
                    className="flex-1 flex flex-col items-center gap-3 px-3 py-5 rounded-2xl active:scale-[0.97] transition-all duration-150"
                    style={{ border: '1px solid rgba(196,181,253,0.22)', background: 'rgba(196,181,253,0.07)', backdropFilter: 'blur(8px)' }}
                  >
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.90)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><circle cx="12" cy="16" r="1" fill="rgba(196,181,253,0.90)" stroke="none"/>
                      </svg>
                    </span>
                    <span className="text-[12.5px] font-medium text-center leading-snug" style={{ color: 'rgba(255,255,255,0.80)' }}>
                      Algo que pode acontecer
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

        {/* ── SESSION ─────────────────────────────────────────────────────── */}
        {phase === 'session' && curTurn && (
          <>
            <div className={`flex flex-col gap-6 transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
              {curTurn.validation && (
                <p
                  className="text-[11.5px] text-center font-medium tracking-wide uppercase"
                  style={{ color: 'rgba(255,255,255,0.32)', letterSpacing: '0.08em' }}
                >
                  {curTurn.validation}
                </p>
              )}

              <p
                className="text-[17px] font-semibold leading-snug text-center px-2"
                style={{ color: 'rgba(255,255,255,0.92)' }}
              >
                {curTurn.question}
              </p>

              <div className="flex flex-col gap-2.5">
                {curTurn.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => onAnswer(opt.type)}
                    className="w-full px-5 py-4 rounded-2xl text-[13.5px] font-medium text-left active:scale-[0.98] transition-all duration-150"
                    style={{
                      border:         '1px solid rgba(255,255,255,0.11)',
                      background:     'rgba(255,255,255,0.06)',
                      color:          'rgba(255,255,255,0.80)',
                      backdropFilter: 'blur(8px)',
                      lineHeight:     '1.45',
                    }}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>

          </>
        )}

        {/* ── COMPLETE ──────────────────────────────────────────────────────── */}
        {phase === 'complete' && (
          <>
            <div className="flex flex-col items-center gap-6 text-center complete-text-in pt-8">
              <p className="text-2xl font-bold leading-snug" style={{ color: 'rgba(255,255,255,0.95)' }}>
                Você voltou pro eixo.
              </p>
              <p className="text-sm leading-relaxed max-w-[220px]" style={{ color: 'rgba(255,255,255,0.48)' }}>
                Sua mente encontrou o presente.
              </p>
              <button
                onClick={onReset}
                className="mt-1 text-[13px] font-medium px-6 py-2.5 rounded-full transition-all active:scale-[0.97]"
                style={{ border: '1px solid rgba(255,255,255,0.20)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)' }}
              >
                Recomeçar
              </button>
            </div>
          </>
        )}

        </div>{/* end scrollable content */}

        {/* ── Axis — fixed at bottom, never moves ─────────────────────────── */}
        {phase !== 'gated' && (
          <div className="flex-shrink-0 px-6 pt-4 pb-28">
            <AxisTrack dotX={dotX} dotVisible={dotVisible} done={done} />
          </div>
        )}

      </div>
    </div>
  );
};

export default EquilibrioPage;
