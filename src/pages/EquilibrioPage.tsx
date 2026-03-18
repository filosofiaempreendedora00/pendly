import { useState } from 'react';
import { Clock, Zap, Crosshair } from 'lucide-react';

/* ── Types ──────────────────────────────────────────────────────────────── */
type Zone = 'past' | 'present' | 'future';

interface StepDef {
  text: string;
  type: 'yesno' | 'action';
  label?: string;
}

/* ── Intervention flows ─────────────────────────────────────────────────── */
const INTERVENTIONS: Record<Zone, StepDef[]> = {
  past: [
    { text: 'Isso ainda está acontecendo agora?',  type: 'yesno' },
    { text: 'Isso está sob seu controle hoje?',     type: 'yesno' },
    { text: 'Observe o ambiente ao seu redor',      type: 'action', label: 'Feito' },
  ],
  future: [
    { text: 'Isso está acontecendo agora?',         type: 'yesno' },
    { text: 'Você pode agir sobre isso agora?',     type: 'yesno' },
    { text: 'Respire fundo 3 vezes',                type: 'action', label: 'Concluir' },
  ],
  present: [
    { text: 'Você está consciente do momento atual?',      type: 'yesno' },
    { text: 'Perceba sua respiração por alguns segundos',   type: 'action', label: 'Feito' },
  ],
};

/* Focus options shown on initial screen */
const ZONE_OPTIONS: {
  key: Zone;
  label: string;
  Icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  bgColor: string;
}[] = [
  {
    key: 'past',
    label: 'Em algo que já aconteceu',
    Icon: Clock,
    iconColor: 'rgba(147,197,253,0.75)',   // blue-300-ish
    borderColor: 'rgba(147,197,253,0.18)',
    bgColor:     'rgba(147,197,253,0.06)',
  },
  {
    key: 'present',
    label: 'Em algo que está acontecendo agora',
    Icon: Crosshair,
    iconColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(255,255,255,0.18)',
    bgColor:     'rgba(255,255,255,0.06)',
  },
  {
    key: 'future',
    label: 'Em algo que pode acontecer',
    Icon: Zap,
    iconColor: 'rgba(196,181,253,0.80)',   // violet-300-ish
    borderColor: 'rgba(196,181,253,0.18)',
    bgColor:     'rgba(196,181,253,0.06)',
  },
];

/* Dot start positions (px from axis centre) */
const START_X: Record<Zone, number> = { past: -108, future: 108, present: 0 };

/* ── Haptic ─────────────────────────────────────────────────────────────── */
const haptic = (pattern: number | number[]) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

/* ── Background style (dark gradient, like intro) ───────────────────────── */
const BG: React.CSSProperties = {
  background: 'linear-gradient(155deg, #0b1728 0%, #0d2040 50%, #101e4a 100%)',
  minHeight: '100vh',
};

/* ── Component ──────────────────────────────────────────────────────────── */
const EquilibrioPage = () => {
  const [zone,     setZone]     = useState<Zone | null>(null);
  const [step,     setStep]     = useState(0);
  const [complete, setComplete] = useState(false);
  const [dotX,     setDotX]     = useState(0);
  const [dotVis,   setDotVis]   = useState(false);   // dot hidden until selection
  const [fading,   setFading]   = useState(false);

  /* Fade helper */
  const advance = (cb: () => void) => {
    setFading(true);
    setTimeout(() => { cb(); setFading(false); }, 190);
  };

  /* Select zone */
  const handleZoneSelect = (z: Zone) => {
    haptic(8);
    advance(() => {
      setZone(z);
      setStep(0);
      setDotX(START_X[z]);
      setDotVis(true);
    });
  };

  /* Advance a step */
  const handleStepAdvance = () => {
    if (!zone) return;
    haptic(8);
    const steps    = INTERVENTIONS[zone];
    const nextStep = step + 1;

    advance(() => {
      if (nextStep >= steps.length) {
        setDotX(0);
        setComplete(true);
        haptic([10, 60, 18]);
      } else {
        const startX   = START_X[zone];
        const progress = nextStep / steps.length;
        setDotX(startX * (1 - progress));
        setStep(nextStep);
      }
    });
  };

  /* Reset */
  const handleReset = () => {
    haptic(8);
    setZone(null);
    setStep(0);
    setComplete(false);
    setDotX(0);
    setDotVis(false);
    setFading(false);
  };

  const currentStep = zone ? INTERVENTIONS[zone][step] : null;

  /* ── Axis ─────────────────────────────────────────────────────────────── */
  const Axis = () => (
    <div className="relative w-full flex items-center justify-center" style={{ height: 72 }}>

      {/* Line */}
      <div
        className="absolute"
        style={{
          left: 16, right: 16, height: 1,
          background: 'rgba(255,255,255,0.15)',
        }}
      />

      {/* Static centre marker */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all duration-500"
        style={{
          background: complete ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)',
          boxShadow:  complete ? '0 0 0 4px rgba(255,255,255,0.08)' : 'none',
        }}
      />

      {/* Animated dot — hidden until selection */}
      <div
        className={`absolute left-1/2 w-5 h-5 rounded-full shadow-lg ${complete ? 'axis-dot-glow-dark' : ''}`}
        style={{
          background:  complete ? '#fff' : 'rgba(255,255,255,0.92)',
          opacity:     dotVis ? 1 : 0,
          transform:   `translateX(calc(-50% + ${dotX}px))`,
          transition:  dotVis
            ? 'transform 900ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 350ms ease'
            : 'opacity 350ms ease',
        }}
      />

      {/* Labels */}
      <div
        className="absolute flex justify-between"
        style={{ left: 16, right: 16, top: 'calc(50% + 20px)' }}
      >
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Passado
        </span>
        <span
          style={{
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: complete ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.40)',
            fontWeight: complete ? 600 : 400,
            transition: 'color 0.5s, font-weight 0.5s',
          }}
        >
          Presente
        </span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Futuro
        </span>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col" style={BG}>
      <div className="flex-1 flex flex-col px-6 pt-14 max-w-md mx-auto w-full" style={{ minHeight: '100vh' }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>
            Volte pro eixo
          </h1>
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Um momento para se reequilibrar.
          </p>
        </div>

        {/* ── Content area (fades) ────────────────────────────────────────── */}
        <div
          className={`flex flex-col flex-1 transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}
        >

          {/* ─ COMPLETE ─ */}
          {complete && (
            <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
              <p className="text-xl font-semibold leading-snug" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Você voltou pro eixo.
              </p>
              <p className="text-sm leading-relaxed max-w-[200px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Sua mente encontrou o presente.
              </p>
              <button
                onClick={handleReset}
                className="mt-2 text-[12px] transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.50)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.25)')}
              >
                Recomeçar
              </button>
            </div>
          )}

          {/* ─ INITIAL — zone selection ─ */}
          {!complete && zone === null && (
            <div className="flex flex-col gap-5">
              <p
                className="text-[16px] font-semibold text-center leading-snug px-2"
                style={{ color: 'rgba(255,255,255,0.80)' }}
              >
                Onde está sua mente?
              </p>

              <div className="flex flex-col gap-3 mt-1">
                {ZONE_OPTIONS.map(({ key, label, Icon, iconColor, borderColor, bgColor }) => (
                  <button
                    key={key}
                    onClick={() => handleZoneSelect(key)}
                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left active:scale-[0.98] transition-all duration-150"
                    style={{
                      border:     `1px solid ${borderColor}`,
                      background: bgColor,
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Icon size={16} style={{ color: iconColor }} />
                    </span>
                    <span className="text-[14px] font-medium" style={{ color: 'rgba(255,255,255,0.80)' }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─ INTERVENTION STEP ─ */}
          {!complete && zone !== null && currentStep && (
            <div className="flex flex-col gap-8">
              <p
                className="text-[18px] font-semibold leading-snug text-center px-2"
                style={{ color: 'rgba(255,255,255,0.88)' }}
              >
                {currentStep.text}
              </p>

              {currentStep.type === 'yesno' ? (
                <div className="flex gap-3">
                  {['Sim', 'Não'].map(label => (
                    <button
                      key={label}
                      onClick={handleStepAdvance}
                      className="flex-1 py-3.5 rounded-2xl text-[14px] font-semibold active:scale-[0.97] transition-all duration-150"
                      style={{
                        border:     '1px solid rgba(255,255,255,0.18)',
                        background: 'rgba(255,255,255,0.08)',
                        color:      'rgba(255,255,255,0.82)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={handleStepAdvance}
                  className="w-full py-4 rounded-2xl text-[14px] font-bold active:scale-[0.98] transition-all duration-150"
                  style={{
                    background: '#fff',
                    color:      '#0d2040',
                    boxShadow:  '0 6px 28px -6px rgba(0,0,0,0.5)',
                  }}
                >
                  {currentStep.label ?? 'Concluir'}
                </button>
              )}
            </div>
          )}

        </div>

        {/* ── Axis — anchored near bottom ──────────────────────────────────── */}
        <div className="pb-32 pt-8">
          <Axis />
        </div>

      </div>
    </div>
  );
};

export default EquilibrioPage;
