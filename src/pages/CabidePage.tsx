import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import PendulumSlider from '@/components/PendulumSlider';
import NaoSeiFlow from '@/components/NaoSeiFlow';
import { saveEntry, getEntries, getTodayKey, getCurrentPeriod, PERIOD_CONFIG, DayPeriod } from '@/lib/pendulum';
import { Button } from '@/components/ui/button';
import { Sunrise, Sun, Moon } from 'lucide-react';
import { IntroScreen } from '@/components/IntroScreen';

const PERIOD_ICONS: Record<DayPeriod, React.ReactNode> = {
  morning: <Sunrise size={16} />,
  afternoon: <Sun size={16} />,
  night: <Moon size={16} />,
};

// ─── Pêndulo v1 ────────────────────────────────────────────────────────────────
const PenduloV1 = ({ onBack }: { onBack: () => void }) => {
  const todayKey = getTodayKey();
  const [position, setPosition] = useState(50);
  const [showNaoSei, setShowNaoSei] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [period, setPeriod] = useState<DayPeriod>(getCurrentPeriod());

  useEffect(() => {
    const entries = getEntries();
    const todayPeriod = entries.find((e) => e.date === todayKey && e.period === period);
    if (todayPeriod) {
      setPosition(todayPeriod.position);
      setSaved(true);
    } else {
      setPosition(50);
      setSaved(false);
    }
    setHasMoved(false);
  }, [todayKey, period]);

  const handleSave = () => {
    saveEntry({ date: todayKey, position, period });
    setSaved(true);
    setHasMoved(false);
  };

  const handleNaoSeiResult = (pos: number) => {
    setPosition(pos);
    setHasMoved(true);
    setShowNaoSei(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-muted/30">
      {/* Back button */}
      <div className="px-6 pt-10 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Armário
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-[2rem] font-semibold text-foreground mb-1 tracking-tight text-center">
          Onde está seu pêndulo mental agora?
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Toque em 'Descobrir' ou arraste o pêndulo para registrar
        </p>

        <PendulumSlider
          value={position}
          onChange={(v) => { setPosition(v); setSaved(false); setHasMoved(true); }}
        />

        <div className="mt-10">
          {saved ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-primary text-xs font-medium bg-primary/10 rounded-full px-4 py-2">
                {PERIOD_ICONS[period]}
                <span>{PERIOD_CONFIG[period].label} registrada</span>
              </div>
              <span className="text-[11px] text-muted-foreground/50">
                Mova o pêndulo para atualizar
              </span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNaoSei(true)}
                className="w-36 rounded-full h-11 text-sm font-medium"
              >
                Descobrir
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasMoved}
                className={`w-36 rounded-full h-11 text-sm font-medium transition-opacity ${
                  !hasMoved ? 'opacity-35' : ''
                }`}
              >
                Registrar
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-full p-1 mt-6">
          {(['morning', 'afternoon', 'night'] as DayPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {PERIOD_ICONS[p]}
              {PERIOD_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {showNaoSei && (
        <NaoSeiFlow
          onResult={handleNaoSeiResult}
          onCancel={() => setShowNaoSei(false)}
        />
      )}
    </div>
  );
};

// ─── GloveHint backup — dica de arrastar (arquivado do PenduloPage) ───────────
const GloveHint = ({
  bobPos,
  pivotPos,
  direction,
  onDone,
}: {
  bobPos:   { x: number; y: number };
  pivotPos: { x: number; y: number };
  direction: 'left' | 'right';
  onDone: () => void;
}) => {
  type Phase = 'spawn' | 'visible' | 'travel' | 'press' | 'drag' | 'fade';
  const [phase, setPhase] = useState<Phase>('spawn');
  const [arrowVisible, setArrowVisible] = useState(false);

  const startPos = useRef({
    x: 60 + Math.random() * (window.innerWidth - 120),
    y: Math.min(window.innerHeight - 80, bobPos.y + 100 + Math.random() * 80),
  }).current;

  const { x: bx, y: by } = bobPos;
  const R = Math.hypot(bx - pivotPos.x, by - pivotPos.y);
  const swipeDist = Math.min(window.innerWidth * 0.22, 72, R * 0.45);
  const dragDist  = swipeDist * (direction === 'right' ? 1 : -1);
  const deltaY    = R - Math.sqrt(Math.max(0, R * R - swipeDist * swipeDist));
  const arcEndX   = dragDist;
  const arcEndY   = -deltaY;
  const sqrtTerm  = Math.sqrt(Math.max(0, R * R - swipeDist * swipeDist));
  const tanAngle  = direction === 'right'
    ? Math.atan2(-swipeDist,  sqrtTerm) * (180 / Math.PI)
    : Math.atan2(-swipeDist, -sqrtTerm) * (180 / Math.PI);
  const bobR = 28;

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    const q = (ms: number, fn: () => void) => t.push(setTimeout(fn, ms));
    q(80,   () => setPhase('visible'));
    q(700,  () => setPhase('travel'));
    q(2500, () => setPhase('press'));
    q(3100, () => setPhase('drag'));
    q(4650, () => setArrowVisible(true));
    q(5100, () => setPhase('fade'));
    q(5700, () => onDone());
    return () => t.forEach(clearTimeout);
  }, [onDone]);

  const atBob    = ['travel', 'press', 'drag', 'fade'].includes(phase);
  const dragging = phase === 'drag' || phase === 'fade';

  const handX = dragging ? bx + dragDist : atBob ? bx : startPos.x;
  const handY = atBob ? by : startPos.y;
  const opacity = phase === 'spawn' || phase === 'fade' ? 0 : 1;

  const transition =
    phase === 'visible' ? 'opacity 0.5s ease' :
    phase === 'travel'  ? 'left 1.8s cubic-bezier(0.4,0,0.2,1), top 1.8s cubic-bezier(0.4,0,0.2,1)' :
    phase === 'drag'    ? 'left 1.6s cubic-bezier(0.25,0.46,0.45,0.94)' :
    phase === 'fade'    ? 'left 1.6s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.5s ease' :
    'none';

  const sweepFlag = direction === 'right' ? 1 : 0;
  const arcPath   = `M 0,0 A ${R} ${R} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {(phase === 'drag' || phase === 'fade') && (
        <svg style={{
          position: 'fixed', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 9998,
          opacity: phase === 'fade' ? 0 : 1,
          transition: phase === 'fade' ? 'opacity 0.5s ease' : 'none',
        }}>
          <g transform={`translate(${bx}, ${by})`}>
            <path className="hint-arc-path" d={arcPath}
              stroke="rgba(0,0,0,0.38)" strokeWidth="2.5" fill="none"
              strokeLinecap="round" pathLength={1} strokeDasharray={1}
            />
            {arrowVisible && (
              <g transform={`translate(${arcEndX}, ${arcEndY}) rotate(${tanAngle})`}>
                <path d="M -7,-5 L 3,0 L -7,5" stroke="rgba(0,0,0,0.55)" strokeWidth="2.8"
                  fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )}
          </g>
        </svg>
      )}
      <div style={{
        position: 'absolute', left: handX, top: handY,
        transform: 'translate(-50%, 0)', opacity, transition,
        willChange: 'left, top, opacity', fontSize: '2rem', lineHeight: 1,
        userSelect: 'none', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
        zIndex: 9999,
        ...(phase === 'press' ? {
          transform: 'translate(-50%, 4px) scale(0.88)',
          transitionProperty: 'transform', transitionDuration: '0.2s',
        } : {}),
      }}>👆</div>
      {phase === 'press' && (
        <div className="hint-ripple" style={{
          position: 'absolute', left: bx, top: by,
          transform: 'translate(-50%, -50%)', zIndex: 9997,
        }} />
      )}
    </div>
  );
};

// Demo wrapper para o Armário de Testes
const GloveHintDemo = ({ onBack }: { onBack: () => void }) => {
  const bobRef   = useRef<HTMLDivElement>(null);
  const pivotRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint]     = useState(false);
  const [bobPos,   setBobPos]       = useState<{ x: number; y: number } | null>(null);
  const [pivotPos, setPivotPos]     = useState<{ x: number; y: number } | null>(null);
  const [dir,      setDir]          = useState<'left' | 'right'>('right');

  const triggerHint = useCallback(() => {
    if (!bobRef.current || !pivotRef.current) return;
    const rb = bobRef.current.getBoundingClientRect();
    const rp = pivotRef.current.getBoundingClientRect();
    setBobPos({ x: rb.left + rb.width / 2,   y: rb.top + rb.height / 2 });
    setPivotPos({ x: rp.left + rp.width / 2, y: rp.top + rp.height / 2 });
    setDir(Math.random() > 0.5 ? 'right' : 'left');
    setShowHint(true);
  }, []);

  // Auto-trigger after 1.5s so it's easy to preview
  useEffect(() => {
    const t = setTimeout(triggerHint, 1500);
    return () => clearTimeout(t);
  }, [triggerHint]);

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-muted/30">
      <div className="px-6 pt-10 pb-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={15} />
          Armário
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-0">
        {/* Pivot */}
        <div ref={pivotRef} className="w-4 h-4 rounded-full bg-muted-foreground/30" />
        {/* Rod */}
        <div className="w-px bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20 mx-auto" style={{ height: 'clamp(80px,18dvh,180px)' }} />
        {/* Bob */}
        <div ref={bobRef} className="relative w-14 h-14 mx-auto" style={showHint ? { position: 'relative', zIndex: 10000 } : undefined}>
          <div className="absolute inset-0 rounded-full bg-primary/80 flex items-center justify-center">
            <span className="text-2xl">😐</span>
          </div>
        </div>
      </div>
      <div className="text-center pb-8">
        <button
          onClick={() => { setShowHint(false); setTimeout(triggerHint, 300); }}
          className="text-sm text-primary underline"
        >
          Replay animação
        </button>
      </div>
      {showHint && bobPos && pivotPos && (
        <GloveHint
          bobPos={bobPos}
          pivotPos={pivotPos}
          direction={dir}
          onDone={() => setShowHint(false)}
        />
      )}
    </div>
  );
};

// ─── Armário de Testes ──────────────────────────────────────────────────────────
type Cabide = {
  label: string;
  description: string;
  action: 'inline' | 'navigate';
  path?: string;
};

const cabides: Cabide[] = [
  {
    label: 'Intro',
    description: 'Animação de abertura — pêndulo azul e frases de respiro',
    action: 'inline',
  },
  {
    label: 'Pêndulo v1',
    description: 'Interface original do pêndulo',
    action: 'inline',
  },
  {
    label: 'Equilibre-se',
    description: 'Sessão de equilíbrio emocional',
    action: 'navigate',
    path: '/equilibrio',
  },
  {
    label: 'Pendly Premium',
    description: 'Landing page provisória de upgrade (em construção)',
    action: 'navigate',
    path: '/premium',
  },
  {
    label: 'Dica de swipe',
    description: 'Animação GloveHint com arco e emoji 👆 (arquivada)',
    action: 'inline',
  },
];

const CabidePage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  if (active === 'Intro') {
    return <IntroScreen onComplete={() => setActive(null)} />;
  }

  if (active === 'Pêndulo v1') {
    return <PenduloV1 onBack={() => setActive(null)} />;
  }

  if (active === 'Dica de swipe') {
    return <GloveHintDemo onBack={() => setActive(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-muted/30 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
          Apenas para você
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Armário de Testes
        </h1>
      </div>

      {/* ── Aviso de contexto ────────────────────────────────────────── */}
      <div className="mx-4 mb-5 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3 items-start">
        <span className="text-base shrink-0 mt-px">🗂️</span>
        <div>
          <p className="text-[11px] font-bold text-amber-800 mb-0.5 uppercase tracking-wide">Ambiente pessoal</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Aqui ficam telas e funcionalidades congeladas ou descontinuadas — um arquivo vivo pra eu não perder o que já construí.
            Esse espaço não aparece pros outros usuários do app.
          </p>
        </div>
      </div>

      {/* List */}
      <div className="px-4">
        {cabides.map((c, i) => (
          <button
            key={c.label}
            onClick={() => {
              if (c.action === 'inline') setActive(c.label);
              else if (c.path) navigate(c.path);
            }}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-muted/60 active:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-base">🧥</span>
              <div>
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{c.description}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CabidePage;
