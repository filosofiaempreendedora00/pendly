import { useState, useEffect, useCallback, useRef } from 'react';
import { addEntry, getEntries, getTodayKey, getStatusLevel } from '@/lib/pendulum';
import { Button } from '@/components/ui/button';
import EmotionModal from '@/components/EmotionModal';

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

// ─── Cor do pêndulo ──────────────────────────────────────────────────────────
const COLOR_STOPS = [
  { pos: 0,   h: 0,   s: 72, l: 52 },
  { pos: 22,  h: 8,   s: 74, l: 54 },
  { pos: 33,  h: 16,  s: 75, l: 54 },
  { pos: 44,  h: 26,  s: 80, l: 56 },
  { pos: 50,  h: 215, s: 50, l: 58 },
  { pos: 56,  h: 215, s: 50, l: 58 },
  { pos: 67,  h: 152, s: 44, l: 50 },
  { pos: 78,  h: 148, s: 52, l: 44 },
  { pos: 89,  h: 145, s: 60, l: 40 },
  { pos: 100, h: 143, s: 68, l: 33 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const getBobColor = (v: number): string => {
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    const prev = COLOR_STOPS[i - 1];
    const curr = COLOR_STOPS[i];
    if (v <= curr.pos) {
      const range = curr.pos - prev.pos;
      const t = range === 0 ? 0 : (v - prev.pos) / range;
      const useT = (prev.h < 50 && curr.h > 100) ? (t < 0.5 ? 0 : 1) : t;
      return `hsl(${Math.round(lerp(prev.h, curr.h, useT))}, ${Math.round(lerp(prev.s, curr.s, t))}%, ${Math.round(lerp(prev.l, curr.l, t))}%)`;
    }
  }
  const last = COLOR_STOPS[COLOR_STOPS.length - 1];
  return `hsl(${last.h}, ${last.s}%, ${last.l}%)`;
};

// ─── Rostinho SVG ────────────────────────────────────────────────────────────
const FaceSvg = ({ value }: { value: number }) => {
  const mouthControlY = lerp(13, 35, value / 100);

  const renderEyes = () => {
    if (value <= 11) {
      // > < squinting angry eyes (chevrons pointing inward)
      return (
        <>
          <path d="M 10,11 L 16,14 L 10,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
          <path d="M 30,11 L 24,14 L 30,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
        </>
      );
    }
    if (value >= 89) {
      // ^^ happy arc eyes: upward curves
      return (
        <>
          <path d="M 10,16 Q 13,11 16,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88" />
          <path d="M 24,16 Q 27,11 30,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88" />
        </>
      );
    }
    // Default ellipse eyes
    const eyeRY = value > 78 ? 2 : 3;
    const eyeY  = value > 78 ? 15 : 14;
    return (
      <>
        <ellipse cx="13" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" />
        <ellipse cx="27" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" />
      </>
    );
  };

  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {renderEyes()}
      <path
        d={`M 10,24 Q 20,${mouthControlY.toFixed(1)} 30,24`}
        stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88"
      />
    </svg>
  );
};

// ─── PenduloPage ─────────────────────────────────────────────────────────────
const PenduloPage = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDraggingTrack, setIsDraggingTrack] = useState(false);
  const [isDraggingBob,   setIsDraggingBob]   = useState(false);

  const todayKey = getTodayKey();
  const [position,          setPosition]          = useState(50);
  const [saved,             setSaved]             = useState(false);
  const [hasMoved,          setHasMoved]          = useState(false);
  const [showEmotionModal,  setShowEmotionModal]  = useState(false);

  useEffect(() => {
    const entries = getEntries().filter(e => e.date === todayKey);
    const last = entries.sort((a, b) =>
      (b.timestamp ?? '').localeCompare(a.timestamp ?? '')
    )[0];
    if (last) { setPosition(last.position); setSaved(true); }
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
    setShowEmotionModal(true);
  };

  const handleEmotionConfirm = (emotions: string[], note?: string, photo?: string, audio?: string) => {
    addEntry({ date: todayKey, position, emotions, note, photo, audio });
    setSaved(true);
    setHasMoved(false);
    setShowEmotionModal(false);
  };

  const bobColor  = getBobColor(position);
  const angle     = ((position - 50) / 50) * -35;
  const moodLabel = getMoodLabel(position);

  return (
    <div className="flex flex-col h-[100dvh] pb-[88px]">

      {/* ── Área superior: data/hora + header + pêndulo + label ── */}
      <div className="flex-1 flex flex-col items-center px-6 pt-5 min-h-0">

        <DateTimeWidget />

        <h1 className="text-[1.6rem] font-semibold text-foreground mb-1 tracking-tight text-center leading-tight">
          Como você tá agora?
        </h1>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Arraste o pêndulo para registrar seu humor
        </p>

        {/* Pêndulo + label */}
        <div className="flex-1 flex flex-col items-center w-full min-h-0 pb-3 gap-3">

          {/* Pêndulo visual — cresce até no máximo 280px */}
          <div className="flex-1 relative w-full flex items-start justify-center overflow-hidden" style={{ maxHeight: '280px' }}>
            <div className="absolute top-0 w-4 h-4 rounded-full bg-muted-foreground/30 z-10" />
            <div
              className="absolute top-4 origin-top"
              style={{
                transform: `rotate(${angle}deg)`,
                transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            >
              <div
                className="w-px bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20 mx-auto"
                style={{ height: 'clamp(80px, 18dvh, 180px)' }}
              />
              <div className="relative w-14 h-14 mx-auto">
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
                hsl(16,75%,54%) 25%,
                hsl(215,50%,58%) 50%,
                hsl(148,52%,44%) 75%,
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
            Mova o pêndulo novamente para atualizar
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

    </div>
  );
};

export default PenduloPage;
