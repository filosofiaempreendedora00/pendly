import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addEntry, getEntries, getTodayKey, getStatusLevel, getTodayEntryCount, DAILY_FREE_LIMIT, getBobColor } from '@/lib/pendulum';
import type { StatusLevel } from '@/lib/pendulum';
import { Button } from '@/components/ui/button';
import EmotionModal from '@/components/EmotionModal';
import InsightPopup from '@/components/InsightPopup';
import PaywallPopup from '@/components/PaywallPopup';

// ─── Data / hora ao vivo ─────────────────────────────────────────────────────
const DIAS   = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MESES  = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

const useLiveTime = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
};

const DateTimeWidget = () => {
  const now  = useLiveTime();
  const dia  = DIAS[now.getDay()];
  const data = `${now.getDate()} de ${MESES[now.getMonth()]}`;
  const hh   = String(now.getHours()).padStart(2, '0');
  const mm   = String(now.getMinutes()).padStart(2, '0');

  return (
    <div className="flex flex-col items-center mb-2 select-none">
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-semibold mb-0.5">
        {dia}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-[2rem] font-extralight leading-none tracking-tight text-foreground/80">
          {hh}
        </span>
        <span className="text-[1.3rem] font-extralight leading-none text-foreground/40 -mt-1">:</span>
        <span className="text-[2rem] font-extralight leading-none tracking-tight text-foreground/80">
          {mm}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground/40 mt-0.5">
        {data}
      </span>
    </div>
  );
};

// ─── 9 zonas de humor ────────────────────────────────────────────────────────
const MOODS = [
  { label: 'Muuuito mal',   max: 11  },
  { label: 'Muuito mal',    max: 22  },
  { label: 'Muito mal',     max: 33  },
  { label: 'Mal',           max: 44  },
  { label: 'Mais ou menos', max: 56  },
  { label: 'Bem',           max: 67  },
  { label: 'Muito bem',     max: 78  },
  { label: 'Muuito bem',    max: 89  },
  { label: 'Muuuito bem',   max: 100 },
];

const getMoodLabel = (v: number) =>
  MOODS.find(m => v <= m.max)?.label ?? 'muuuito bem';

// ─── Lerp (usado pelo FaceSvg) ───────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// getBobColor é importado de @/lib/pendulum — fonte única da verdade

// ─── Rostinho SVG ────────────────────────────────────────────────────────────
const useBlink = () => {
  const [isBlinking, setIsBlinking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleBlink = () => {
      timerRef.current = setTimeout(() => {
        setIsBlinking(true);
        timerRef.current = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 130);
      }, 2600 + Math.random() * 4000);
    };
    scheduleBlink();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return isBlinking;
};

const FaceSvg = ({ value }: { value: number }) => {
  const isBlinking = useBlink();
  const t = Math.max(0, Math.min(1, value / 100));

  // Hard threshold alinhado com os labels: "Muuuito mal" = value ≤ 11, "Muuuito bem" = value ≥ 90
  const isAngry = value <= 11;
  const isHappy = value >= 90;
  const isNormal = !isAngry && !isHappy;

  // Only blink during normal eye state
  const shouldBlink = isBlinking && isNormal;

  // Continuously interpolated eye parameters
  const eyeY       = lerp(16.0, 13.5, t);
  const eyeRyBase  = lerp(2.0,  3.2,  t);
  const eyeRy      = shouldBlink ? 0.25 : eyeRyBase;
  const eyeOpacity = lerp(0.68, 0.90, t);

  // Mouth: ctrlY < mouthY → arco pra cima → tristeza (⌢)
  //        ctrlY = mouthY → reto (neutro)
  //        ctrlY > mouthY → curva pra baixo → sorriso (⌣, U-shape)
  // lerp(12, 38, 0.5) = 25 = mouthY → perfeitamente reto no neutro
  const mouthCtrlY = lerp(12, 38, t);
  const mouthY     = 25;

  return (
    <svg
      viewBox="0 0 40 40"
      width="100%" height="100%"
      className="pendulum-face"
      style={{ position: 'absolute', inset: 0 }}
    >
      {/* Normal ellipse eyes */}
      {isNormal && (
        <g opacity={shouldBlink ? 0 : 1}>
          <ellipse cx="13" cy={eyeY} rx="2.5" ry={eyeRy} fill="white" opacity={eyeOpacity} />
          <ellipse cx="27" cy={eyeY} rx="2.5" ry={eyeRy} fill="white" opacity={eyeOpacity} />
        </g>
      )}

      {/* Sad/angry chevron eyes — abrupt snap at very low values */}
      {isAngry && (
        <>
          <path d="M 11,11 L 17,14 L 11,17" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.76" />
          <path d="M 29,11 L 23,14 L 29,17" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.76" />
        </>
      )}

      {/* Happy arc eyes — abrupt snap at very high values */}
      {isHappy && (
        <>
          <path d="M 10,16 Q 13,11 16,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.90" />
          <path d="M 24,16 Q 27,11 30,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.90" />
        </>
      )}

      {/* Mouth: frown (value=0) → straight (value=50) → smile (value=100) */}
      <path
        d={`M 10,${mouthY} Q 20,${mouthCtrlY.toFixed(1)} 30,${mouthY}`}
        stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"
        opacity={lerp(0.70, 0.90, t)}
      />
    </svg>
  );
};

// ─── GloveHint — dica de arrastar ────────────────────────────────────────────
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
  // Raio real do pêndulo (distância pivô → bob)
  const R = Math.hypot(bx - pivotPos.x, by - pivotPos.y);
  // Distância horizontal do swipe (limitada a R para não extrapolar o arco)
  const swipeDist = Math.min(window.innerWidth * 0.22, 72, R * 0.45);
  const dragDist  = swipeDist * (direction === 'right' ? 1 : -1);
  // Quanto o bob sobe ao ser arrastado (arco circular real)
  const deltaY    = R - Math.sqrt(Math.max(0, R * R - swipeDist * swipeDist));
  // Endpoint do arco em coordenadas relativas ao bob
  const arcEndX   = dragDist;
  const arcEndY   = -deltaY;                         // negativo = sobe na tela
  // Ângulo da tangente no endpoint — direção real de movimento do bob
  // right: (sqrt(R²-d²), -d)/R → atan2(-d, sqrt) ; left: (-sqrt, -d)/R → atan2(-d, -sqrt)
  const sqrtTerm = Math.sqrt(Math.max(0, R * R - swipeDist * swipeDist));
  const tanAngle = direction === 'right'
    ? Math.atan2(-swipeDist,  sqrtTerm) * (180 / Math.PI)
    : Math.atan2(-swipeDist, -sqrtTerm) * (180 / Math.PI);
  // Raio do bob (w-14 = 56px → r=28px)
  const bobR = 28;

  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    const q = (ms: number, fn: () => void) => t.push(setTimeout(fn, ms));
    q(80,   () => setPhase('visible'));
    q(700,  () => setPhase('travel'));
    q(2500, () => setPhase('press'));
    q(3100, () => { setPhase('drag'); });
    q(3700, () => setArrowVisible(true));   // aparece quando o arco sai do rosto (~0.6s após drag)
    q(4700, () => setPhase('fade'));
    q(5300, () => onDone());
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

  // SVG do arco: origem em (bx, by), overflow visible, z-index abaixo do emoji
  const sweepFlag = direction === 'right' ? 1 : 0;
  // Arco SVG circular real: M 0,0 A R R 0 0 sweep arcEndX arcEndY
  const arcPath = `M 0,0 A ${R} ${R} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>

      {/* Arco circular real — atrás do emoji (zIndex menor) */}
      {(phase === 'drag' || phase === 'fade') && (
        <svg
          width={0} height={0}
          style={{
            position: 'absolute',
            left: bx,
            top: by,
            overflow: 'visible',
            zIndex: 9998,
            opacity: phase === 'fade' ? 0 : 1,
            transition: phase === 'fade' ? 'opacity 0.5s ease' : 'none',
          }}
        >
          <defs>
            {/* ClipPath exclui área do bob (arco só aparece fora da carinha) */}
            <clipPath id="hint-bob-clip" clipPathUnits="userSpaceOnUse">
              <path
                clipRule="evenodd"
                d={`M -9999 -9999 H 9999 V 9999 H -9999 Z M ${bobR} 0 A ${bobR} ${bobR} 0 1 0 ${-bobR} 0 A ${bobR} ${bobR} 0 1 0 ${bobR} 0 Z`}
              />
            </clipPath>
          </defs>

          {/* Arco desenhado progressivamente */}
          <path
            className="hint-arc-path"
            d={arcPath}
            stroke="rgba(0,0,0,0.38)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            clipPath="url(#hint-bob-clip)"
          />

          {/* Pontinha — aparece quando o arco atinge o perímetro do rosto (~39% do arco)
              A fração do arco dentro do bob ≈ arcsin(bobR/R)/arcsin(swipeDist/R)
              Com R≈192, bobR=28, swipeDist≈72: ≈ 8.4°/22° ≈ 38% → delay ≈ 0.38×1.6s ≈ 0.6s */}
          <g
            transform={`translate(${arcEndX}, ${arcEndY}) rotate(${tanAngle})`}
            style={{
              opacity: arrowVisible ? 1 : 0,
              transition: 'opacity 0.35s ease-out',
            }}
          >
            <path d="M -5,-4 L 1,0 L -5,4" stroke="rgba(0,0,0,0.45)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </svg>
      )}

      {/* Emoji 👆 — zIndex maior que o arco */}
      <div
        style={{
          position: 'absolute',
          left: handX,
          top: handY,
          transform: 'translate(-50%, 0)',
          opacity,
          transition,
          willChange: 'left, top, opacity',
          fontSize: '2rem',
          lineHeight: 1,
          userSelect: 'none',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.18))',
          zIndex: 9999,
          ...(phase === 'press' ? {
            transform: 'translate(-50%, 4px) scale(0.88)',
            transitionProperty: 'transform',
            transitionDuration: '0.2s',
          } : {}),
        }}
      >
        👆
      </div>

      {/* Ripple de clique */}
      {phase === 'press' && (
        <div
          className="hint-ripple"
          style={{ position: 'absolute', left: bx, top: by, transform: 'translate(-50%, -50%)', zIndex: 9997 }}
        />
      )}
    </div>
  );
};

// ─── PenduloPage ─────────────────────────────────────────────────────────────
const PenduloPage = () => {
  const navigate = useNavigate();
  const trackRef  = useRef<HTMLDivElement>(null);
  const bobRef    = useRef<HTMLDivElement>(null);
  const pivotRef  = useRef<HTMLDivElement>(null);
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);
  const [isDraggingBob,   setIsDraggingBob]   = useState(false);

  const todayKey = getTodayKey();
  const [position,          setPosition]          = useState(50);
  const [saved,             setSaved]             = useState(false);
  const [hasMoved,          setHasMoved]          = useState(false);
  const [showEmotionModal,  setShowEmotionModal]  = useState(false);
  const [showPaywall,       setShowPaywall]       = useState(false);

  // ── Hint glove ───────────────────────────────────────────────────────────
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showHint,     setShowHint]     = useState(false);
  const [hintDir,      setHintDir]      = useState<'left' | 'right'>('right');
  const [hintBobPos,   setHintBobPos]   = useState<{ x: number; y: number } | null>(null);
  const [hintPivotPos, setHintPivotPos] = useState<{ x: number; y: number } | null>(null);

  const scheduleHint = useCallback(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => {
      if (!bobRef.current || !pivotRef.current) return;
      const rb = bobRef.current.getBoundingClientRect();
      const rp = pivotRef.current.getBoundingClientRect();
      setHintBobPos({ x: rb.left + rb.width / 2, y: rb.top + rb.height / 2 });
      setHintPivotPos({ x: rp.left + rp.width / 2, y: rp.top + rp.height / 2 });
      setHintDir(Math.random() > 0.5 ? 'right' : 'left');
      setShowHint(true);
    }, 10_000);
  }, []);

  const interruptHint = useCallback(() => {
    setShowHint(false);
    scheduleHint();
  }, [scheduleHint]);

  // Inicia timer ao montar
  useEffect(() => {
    scheduleHint();
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); };
  }, [scheduleHint]);

  // Reseta ao interagir com o pêndulo
  useEffect(() => {
    if (isDraggingTrack || isDraggingBob) interruptHint();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingTrack, isDraggingBob]);

  // ── Insight popup ────────────────────────────────────────────────────────
  const [showInsight,  setShowInsight]  = useState(false);
  const [insightData,  setInsightData]  = useState<{
    emotions: string[];
    note?: string;
    position: number;
    statusLevel: StatusLevel;
    bobColor: string;
  } | null>(null);

  // Cancela quando modais abrem
  useEffect(() => {
    if (showEmotionModal || showPaywall || showInsight) {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setShowHint(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEmotionModal, showPaywall, showInsight]);

  useEffect(() => {
    const entries = getEntries().filter(e => e.date === todayKey);
    const last = entries.sort((a, b) =>
      (b.timestamp ?? '').localeCompare(a.timestamp ?? '')
    )[0];
    if (last) { setPosition(50); setSaved(true); }
    else       { setPosition(50); setSaved(false); }
    setHasMoved(false);
  }, [todayKey]);

  const updateFromPointer = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x   = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = Math.round((x / rect.width) * 100);
    setPosition(pct);
    setSaved(false);
    setHasMoved(true);
  }, []);

  const onTrackDown = (e: React.PointerEvent) => {
    setIsDraggingTrack(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX);
  };
  const onTrackMove = (e: React.PointerEvent) => { if (isDraggingTrack) updateFromPointer(e.clientX); };
  const onTrackUp   = () => setIsDraggingTrack(false);

  const onBobDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingBob(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onBobMove = (e: React.PointerEvent) => { if (isDraggingBob) updateFromPointer(e.clientX); };
  const onBobUp   = () => setIsDraggingBob(false);

  const isDragging = isDraggingTrack || isDraggingBob;

  // Opens the emotion modal — actual save happens in handleEmotionConfirm
  const handleSave = () => {
    if (getTodayEntryCount() >= DAILY_FREE_LIMIT) {
      setShowPaywall(true);
      return;
    }
    setShowEmotionModal(true);
  };

  const handleEmotionConfirm = (emotions: string[], note?: string, photo?: string, audio?: string) => {
    addEntry({ date: todayKey, position, emotions, note, photo, audio });
    setSaved(true);
    setHasMoved(false);
    setShowEmotionModal(false);
    // Mostra popup de insight logo após o registro
    setInsightData({
      emotions,
      note,
      position,
      statusLevel: getStatusLevel(position),
      bobColor: getBobColor(position),
    });
    setShowInsight(true);
  };

  const bobColor  = getBobColor(position);
  const angle     = ((position - 50) / 50) * -35;
  const moodLabel = getMoodLabel(position);

  return (
    <div className="flex flex-col h-[100dvh] pb-[88px] overflow-hidden" onPointerDown={interruptHint}>

      {/* ── Área superior: data/hora + header + pêndulo + label ── */}
      <div className="flex-1 flex flex-col items-center px-6 pt-5 min-h-0">

        <DateTimeWidget />

        <h1 className="text-[1.6rem] font-semibold text-foreground mb-1 tracking-tight text-center leading-tight">
          Como você tá agora?
        </h1>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Arraste o pêndulo pra registrar seu humor
        </p>

        {/* Pêndulo + label */}
        <div className="flex-1 flex flex-col items-center w-full min-h-0 pb-3 gap-3">

          {/* Pêndulo visual — cresce até no máximo 280px */}
          <div className="flex-1 relative w-full flex items-start justify-center overflow-hidden" style={{ maxHeight: '280px' }}>
            <div ref={pivotRef} className="absolute top-0 w-4 h-4 rounded-full bg-muted-foreground/30 z-10" />
            <div
              className="absolute top-4 origin-top"
              style={{
                transform: `rotate(${angle}deg)`,
                transition: isDragging ? 'none' : 'transform 550ms cubic-bezier(0.34, 1.18, 0.64, 1)',
              }}
            >
              <div
                className="w-px bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20 mx-auto"
                style={{ height: 'clamp(80px, 18dvh, 180px)' }}
              />
              <div ref={bobRef} className="relative w-14 h-14 mx-auto">
                <div
                  className="absolute -inset-5 rounded-full cursor-grab active:cursor-grabbing touch-none select-none z-10"
                  onPointerDown={onBobDown}
                  onPointerMove={onBobMove}
                  onPointerUp={onBobUp}
                />
                <div
                  className="w-14 h-14 rounded-full relative overflow-hidden"
                  style={{
                    backgroundColor: bobColor,
                    boxShadow: `0 6px 24px ${bobColor}70`,
                    transition: isDragging ? 'background-color 80ms' : 'background-color 300ms, box-shadow 300ms',
                  }}
                >
                  <FaceSvg value={position} />
                </div>
              </div>
            </div>
          </div>

          {/* Label do humor */}
          <div
            className="text-xl font-semibold text-center transition-all duration-200 min-h-[1.75rem]"
            style={{ color: bobColor }}
          >
            {moodLabel}
          </div>

        </div>

      </div>

      {/* ── Barrinha — ancorada acima do botão ── */}
      <div className="px-6 pb-4 shrink-0">
        <div className="w-full max-w-xs mx-auto">
          <div
            ref={trackRef}
            onPointerDown={onTrackDown}
            onPointerMove={onTrackMove}
            onPointerUp={onTrackUp}
            className="relative h-3 rounded-full cursor-pointer touch-none select-none"
            style={{
              background: `linear-gradient(to right,
                hsl(0,72%,52%) 0%,
                hsl(8,73%,54%) 11%,
                hsl(16,75%,54%) 22%,
                hsl(28,72%,56%) 33%,
                hsl(46,80%,58%) 44%,
                hsl(35,25%,62%) 48%,
                hsl(215,50%,58%) 50%,
                hsl(215,50%,58%) 56%,
                hsl(152,44%,50%) 67%,
                hsl(148,52%,44%) 78%,
                hsl(145,60%,40%) 89%,
                hsl(143,68%,33%) 100%)`,
            }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-[3px] border-background shadow-md pointer-events-none"
              style={{
                left: `${position}%`,
                backgroundColor: bobColor,
                transition: isDragging ? 'none' : 'left 400ms cubic-bezier(0.25,0.46,0.45,0.94), background-color 80ms',
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-medium text-muted-foreground/50 select-none">
            <span>Muuuito mal</span>
            <span>Mais ou menos</span>
            <span>Muuuito bem</span>
          </div>
        </div>
      </div>

      {/* ── Botão registrar — logo acima do menu ── */}
      <div className="flex justify-center items-center px-6 py-4 h-20 shrink-0">
        {saved ? (
          <span className="text-[11px] text-muted-foreground/40">
            Mova o pêndulo pra fazer um novo registro
          </span>
        ) : (
          <Button
            onClick={handleSave}
            disabled={!hasMoved}
            className={`w-40 rounded-full h-12 text-sm font-medium transition-opacity ${
              !hasMoved ? 'opacity-30' : ''
            }`}
          >
            Registrar
          </Button>
        )}
      </div>

      {/* ── Modal de emoções ── */}
      <EmotionModal
        isOpen={showEmotionModal}
        onClose={() => setShowEmotionModal(false)}
        onConfirm={handleEmotionConfirm}
        statusLevel={getStatusLevel(position)}
        bobColor={bobColor}
      />

      {/* ── Popup de insight pós-registro ── */}
      {insightData && (
        <InsightPopup
          isOpen={showInsight}
          onClose={() => setShowInsight(false)}
          statusLevel={insightData.statusLevel}
          position={insightData.position}
          emotions={insightData.emotions}
          note={insightData.note}
          bobColor={insightData.bobColor}
        />
      )}

      {/* ── Hint glove ── */}
      {showHint && hintBobPos && hintPivotPos && (
        <GloveHint
          bobPos={hintBobPos}
          pivotPos={hintPivotPos}
          direction={hintDir}
          onDone={() => { setShowHint(false); scheduleHint(); }}
        />
      )}

      {/* ── Paywall: limite diário ── */}
      {showPaywall && (
        <PaywallPopup
          onClose={() => setShowPaywall(false)}
          onManageToday={() => { setShowPaywall(false); navigate('/biblioteca'); }}
        />
      )}

    </div>
  );
};

export default PenduloPage;
