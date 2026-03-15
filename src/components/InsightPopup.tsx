import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Scale, TrendingUp } from 'lucide-react';
import { generateInsight, type InsightInput } from '@/lib/insights';

// ─── Confetti ────────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

const CONFETTI_COLORS = [
  '#93c5fd', '#86efac', '#fde68a', '#c4b5fd',
  '#f9a8d4', '#6ee7b7', '#a5b4fc', '#fca5a5',
];

const buildParticles = (): Particle[] =>
  Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2;
    const dist  = 28 + Math.random() * 32;
    return {
      id:       i,
      tx:       Math.round(Math.cos(angle) * dist),
      ty:       Math.round(Math.sin(angle) * dist * 0.75),
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:     3 + Math.random() * 4,
      delay:    Math.random() * 0.12,
      duration: 0.55 + Math.random() * 0.3,
    };
  });

// ─── Som suave de sucesso (Web Audio API) ────────────────────────────────────
const playSuccessChime = () => {
  try {
    const ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Três notas: C5 → E5 → G5 (acorde de dó maior)
    const notes: [number, number][] = [
      [523.25, 0],
      [659.25, 0.12],
      [783.99, 0.24],
    ];

    notes.forEach(([freq, offset]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.07, t + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  } catch {
    // Web Audio não disponível — silêncio
  }
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface InsightPopupProps extends InsightInput {
  isOpen: boolean;
  onClose: () => void;
  bobColor: string;
}

// ─── Componente ──────────────────────────────────────────────────────────────
const InsightPopup = ({
  isOpen,
  onClose,
  bobColor,
  statusLevel,
  position,
  emotions,
  note,
}: InsightPopupProps) => {
  const navigate   = useNavigate();
  const [particles, setParticles] = useState<Particle[]>([]);
  const chimePlayed = useRef(false);

  const { line1, line2 } = useMemo(
    () => generateInsight({ statusLevel, position, emotions, note }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusLevel, position, emotions.join(','), note],
  );

  // Dispara animações e som quando o popup abre
  useEffect(() => {
    if (!isOpen) { chimePlayed.current = false; return; }

    setParticles(buildParticles());

    if (!chimePlayed.current) {
      chimePlayed.current = true;
      // Pequeno delay para o popup terminar de aparecer
      const t = setTimeout(playSuccessChime, 80);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-border/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Linha de acento no topo */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(to right, transparent, ${bobColor}80, transparent)`,
          }}
        />

        <div className="px-6 pt-5 pb-6">

          {/* Botão fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-[18px] right-4 w-7 h-7 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <X size={13} />
          </button>

          {/* ── SEÇÃO 1: Reforço de hábito ───────────────────────────────── */}
          <div className="flex flex-col items-center pt-1 pb-5">

            {/* Ícone de check + confetti */}
            <div className="relative flex items-center justify-center mb-3" style={{ width: 72, height: 72 }}>

              {/* Partículas de confetti */}
              {particles.map(p => (
                <div
                  key={p.id}
                  className="confetti-particle"
                  style={{
                    width:    p.size,
                    height:   p.size,
                    backgroundColor: p.color,
                    '--tx':   `${p.tx}px`,
                    '--ty':   `${p.ty}px`,
                    animationDelay:    `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Círculo com checkmark animado */}
              <div
                className="check-ring w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${bobColor}18` }}
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <circle
                    cx="15" cy="15" r="13"
                    stroke={bobColor}
                    strokeWidth="1.5"
                    opacity="0.35"
                  />
                  <path
                    d="M9 15.5 L13.5 20 L21 11"
                    stroke={bobColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="checkmark-path"
                  />
                </svg>
              </div>
            </div>

            {/* Texto de confirmação */}
            <p className="text-[15px] font-semibold text-foreground">
              Registro realizado
            </p>
            <p className="text-[13px] text-muted-foreground/55 mt-0.5">
              Check-in do dia registrado.
            </p>
          </div>

          {/* Divisor */}
          <div className="h-px bg-border/50 mb-5" />

          {/* ── SEÇÃO 2: Reflexão personalizada ──────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[13px] leading-none">✨</span>
              <span className="text-[10.5px] font-semibold text-muted-foreground/55 uppercase tracking-[0.15em]">
                Um pensamento para você
              </span>
            </div>

            <p className="text-[15px] leading-relaxed text-foreground font-medium">
              {line1}
            </p>
            <p className="text-[15px] leading-relaxed text-foreground/60 mt-2">
              {line2}
            </p>
          </div>

          {/* ── Navegação por ícones ──────────────────────────────────────── */}
          <div className="flex justify-center gap-12">

            <button
              onClick={() => { onClose(); navigate('/equilibrio'); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 group-hover:scale-105"
                style={{ backgroundColor: `${bobColor}15` }}
              >
                <Scale size={20} style={{ color: bobColor }} opacity={0.7} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground/55 group-hover:text-muted-foreground/80 transition-colors">
                Equilibrar
              </span>
            </button>

            <button
              onClick={() => { onClose(); navigate('/biblioteca'); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 group-hover:scale-105"
                style={{ backgroundColor: `${bobColor}15` }}
              >
                <TrendingUp size={20} style={{ color: bobColor }} opacity={0.7} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground/55 group-hover:text-muted-foreground/80 transition-colors">
                Evolução
              </span>
            </button>

          </div>

        </div>
      </div>
    </div>
  );
};

export default InsightPopup;
