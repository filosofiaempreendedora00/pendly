import { useState } from 'react';

/* ── Types ──────────────────────────────────────────────────────────────── */
type Focus = 'past' | 'present' | 'future';

interface StepDef {
  text: string;
  type: 'yesno' | 'action';
  label?: string;
}

/* ── Intervention flows ─────────────────────────────────────────────────── */
const INTERVENTIONS: Record<Focus, StepDef[]> = {
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

/* Dot starting position in px relative to centre of axis */
const START_X: Record<Focus, number> = { past: -74, future: 74, present: 0 };

/* ── Haptic helper ──────────────────────────────────────────────────────── */
const haptic = (pattern: number | number[]) => {
  if (navigator.vibrate) navigator.vibrate(pattern);
};

/* ── Component ──────────────────────────────────────────────────────────── */
const EquilibrioPage = () => {
  const [focus,    setFocus]    = useState<Focus | null>(null);
  const [step,     setStep]     = useState(0);
  const [complete, setComplete] = useState(false);
  const [dotX,     setDotX]     = useState(20);   // slight rightward offset at start
  const [fading,   setFading]   = useState(false);

  /* Fade helper — runs callback after content fades out, then fades back in */
  const advance = (cb: () => void) => {
    setFading(true);
    setTimeout(() => { cb(); setFading(false); }, 190);
  };

  /* Select which mental zone is pulling the user */
  const handleFocusSelect = (f: Focus) => {
    haptic(8);
    advance(() => {
      setFocus(f);
      setStep(0);
      setDotX(START_X[f]);
    });
  };

  /* Advance through the intervention steps */
  const handleStepAdvance = () => {
    if (!focus) return;
    haptic(8);
    const steps    = INTERVENTIONS[focus];
    const nextStep = step + 1;

    advance(() => {
      if (nextStep >= steps.length) {
        setDotX(0);
        setComplete(true);
        haptic([10, 60, 18]);
      } else {
        const startX   = START_X[focus];
        const progress = nextStep / steps.length;
        setDotX(startX * (1 - progress));
        setStep(nextStep);
      }
    });
  };

  /* Reset everything */
  const handleReset = () => {
    haptic(8);
    setFocus(null);
    setStep(0);
    setComplete(false);
    setDotX(20);
    setFading(false);
  };

  const currentSteps = focus ? INTERVENTIONS[focus] : [];
  const currentStep  = currentSteps[step];

  /* ── Axis ─────────────────────────────────────────────────────────────── */
  const Axis = () => (
    <div className="relative w-full flex items-center justify-center" style={{ height: 64 }}>

      {/* Horizontal line */}
      <div className="absolute left-8 right-8 h-px bg-border/50" />

      {/* Static centre marker */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-colors duration-500 ${
          complete ? 'bg-primary/35' : 'bg-border/55'
        }`}
      />

      {/* Animated dot */}
      <div
        className={`absolute left-1/2 w-[18px] h-[18px] rounded-full bg-primary shadow-md ${
          complete ? 'axis-dot-glow' : ''
        }`}
        style={{
          transform:  `translateX(calc(-50% + ${dotX}px))`,
          transition: 'transform 640ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />

      {/* Labels — below the line */}
      <div
        className="absolute left-8 right-8 flex justify-between"
        style={{ top: 'calc(50% + 18px)' }}
      >
        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">
          Passado
        </span>
        <span
          className={`text-[8px] uppercase tracking-widest transition-colors duration-500 ${
            complete ? 'text-primary font-semibold' : 'text-muted-foreground/55'
          }`}
        >
          Presente
        </span>
        <span className="text-[8px] text-muted-foreground/40 uppercase tracking-widest">
          Futuro
        </span>
      </div>
    </div>
  );

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex-1 flex flex-col px-6 pt-14 pb-36 max-w-md mx-auto w-full">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Voltar ao eixo
          </h1>
          <p className="text-xs text-muted-foreground/55 mt-1.5">
            Um momento para se recentrar
          </p>
        </div>

        {/* Temporal axis */}
        <Axis />

        {/* Content area — fades between states */}
        <div
          className={`flex flex-col flex-1 mt-12 transition-opacity duration-200 ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        >

          {/* ── COMPLETE ── */}
          {complete && (
            <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
              <p className="text-xl font-semibold text-foreground leading-snug">
                Você voltou pro eixo.
              </p>
              <p className="text-sm text-muted-foreground/55 max-w-[220px] leading-relaxed">
                Sua mente encontrou o presente.
              </p>
              <button
                onClick={handleReset}
                className="mt-3 text-[12px] text-muted-foreground/40 hover:text-muted-foreground/65 transition-colors"
              >
                Recomeçar
              </button>
            </div>
          )}

          {/* ── INITIAL — focus selection ── */}
          {!complete && focus === null && (
            <div className="flex flex-col gap-5">
              <p className="text-[15px] font-medium text-foreground/80 text-center leading-snug px-2">
                O que mais está puxando sua mente agora?
              </p>

              <div className="flex flex-col gap-3 mt-2">
                {(
                  [
                    { key: 'past',    label: 'Algo que já aconteceu'        },
                    { key: 'future',  label: 'Algo que pode acontecer'      },
                    { key: 'present', label: 'O que está acontecendo agora' },
                  ] as { key: Focus; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleFocusSelect(key)}
                    className="w-full py-3.5 px-5 rounded-full border border-border/60 text-[13px] font-medium text-foreground/70 hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-[0.98] transition-all duration-150 text-center"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── INTERVENTION STEP ── */}
          {!complete && focus !== null && currentStep && (
            <div className="flex flex-col gap-8">

              {/* Step prompt */}
              <p className="text-[17px] font-medium text-foreground leading-snug text-center px-2">
                {currentStep.text}
              </p>

              {/* Buttons */}
              {currentStep.type === 'yesno' ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleStepAdvance}
                    className="flex-1 py-3 rounded-full border border-border/60 text-[13px] font-medium text-foreground/70 hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150"
                  >
                    Sim
                  </button>
                  <button
                    onClick={handleStepAdvance}
                    className="flex-1 py-3 rounded-full border border-border/60 text-[13px] font-medium text-foreground/70 hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStepAdvance}
                  className="w-full py-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-semibold active:scale-[0.98] transition-all duration-150 shadow-sm"
                  style={{ boxShadow: '0 4px 18px -4px hsl(var(--primary) / 0.35)' }}
                >
                  {currentStep.label ?? 'Concluir'}
                </button>
              )}
            </div>
          )}

        </div>{/* end content area */}
      </div>
    </div>
  );
};

export default EquilibrioPage;
