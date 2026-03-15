import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, BookHeart, TrendingUp } from 'lucide-react';
import { generateInsight, type InsightInput } from '@/lib/insights';

const PRIMARY = 'hsl(var(--primary))';

// ─── Confetti ────────────────────────────────────────────────────────────────
interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
  w: number;
  h: number;
  delay: number;
  duration: number;
  radius: string;
  rotate: number;
}

const CONFETTI_COLORS = [
  '#93c5fd', '#6ea8fe', '#a5b4fc',
  '#86efac', '#6ee7b7',
  '#fde68a', '#fbbf24',
  '#f9a8d4', '#c4b5fd',
  '#ffffff',
];

const buildParticles = (): Particle[] =>
  Array.from({ length: 22 }, (_, i) => {
    const angle  = (i / 22) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist   = 50 + Math.random() * 55;
    const isRect = i % 3 === 0;
    const base   = 5 + Math.random() * 5;
    return {
      id:       i,
      tx:       Math.round(Math.cos(angle) * dist),
      ty:       Math.round(Math.sin(angle) * dist * 0.72),
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w:        isRect ? base * 0.65 : base,
      h:        isRect ? base * 1.6  : base,
      delay:    i * 0.012,
      duration: 0.65 + Math.random() * 0.35,
      radius:   isRect ? '2px' : '50%',
      rotate:   Math.random() * 360,
    };
  });

// ─── Som de check / vitória ───────────────────────────────────────────────────
// Duas notas com onda triangular — mais quentes e musicais do que sine puro.
// G5 (784 Hz) → C6 (1047 Hz): intervalo de quarta perfeita, soa como "missão cumprida".
const playCheckSound = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const hits: [number, number, number, number][] = [
      // [freq,    startOffset, volume, duration]
      [783.99,  0,     0.13, 0.45],   // G5 — primeiro ding
      [1046.50, 0.17,  0.10, 0.55],   // C6 — segundo ding (mais alto, mais longo)
    ];

    hits.forEach(([freq, offset, vol, dur]) => {
      // Onda principal: triangle (mais rica que sine, sem chiado)
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      // Harmônico suave: sine na oitava acima, volume 1/5
      const harm = ctx.createOscillator();
      harm.type = 'sine';
      harm.frequency.value = freq * 2;

      const gain = ctx.createGain();
      osc.connect(gain);
      harm.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + offset;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol,   t + 0.012); // ataque limpo
      gain.gain.setValueAtTime(vol,             t + 0.025); // sustain brevíssimo
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.start(t);
      harm.start(t);
      osc.stop(t + dur + 0.05);
      harm.stop(t + dur + 0.05);
    });
  } catch {
    // Web Audio não disponível
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
  statusLevel,
  position,
  emotions,
  note,
}: InsightPopupProps) => {
  const navigate    = useNavigate();
  const [particles, setParticles] = useState<Particle[]>([]);
  const soundPlayed = useRef(false);

  const { line1, line2 } = useMemo(
    () => generateInsight({ statusLevel, position, emotions, note }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusLevel, position, emotions.join(','), note],
  );

  useEffect(() => {
    if (!isOpen) { soundPlayed.current = false; return; }

    setParticles(buildParticles());

    if (!soundPlayed.current) {
      soundPlayed.current = true;
      const t = setTimeout(playCheckSound, 60);
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

        <div className="px-6 pt-5 pb-7">

          {/* Botão fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
          >
            <X size={13} />
          </button>

          {/* ── SEÇÃO 1: Confirmação de hábito ───────────────────────────── */}
          <div className="flex flex-col items-center pt-1 pb-6">

            {/* Check + confetti */}
            <div
              className="relative flex items-center justify-center mb-5"
              style={{ width: 80, height: 80 }}
            >
              {particles.map(p => (
                <div
                  key={p.id}
                  className="confetti-particle"
                  style={{
                    width:           p.w,
                    height:          p.h,
                    backgroundColor: p.color,
                    borderRadius:    p.radius,
                    '--tx':          `${p.tx}px`,
                    '--ty':          `${p.ty}px`,
                    animationDelay:    `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                    transform:       `rotate(${p.rotate}deg)`,
                  } as React.CSSProperties}
                />
              ))}

              <div
                className="check-ring w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: PRIMARY }}
              >
                <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M10 20.5 L17 28 L30 13"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="checkmark-path"
                  />
                </svg>
              </div>
            </div>

            {/* Título curto de confirmação */}
            <p className="text-[16px] font-semibold text-foreground text-center">
              Registro feito
            </p>

            {/* Subtexto de reforço */}
            <p className="text-[12.5px] text-muted-foreground/55 text-center leading-relaxed mt-1.5 px-6">
              Mais um momento guardado na sua Biblioteca de Emoções 📚
            </p>
          </div>

          {/* ── Divisor sutil ─────────────────────────────────────────────── */}
          <div className="h-px bg-muted-foreground/15 mx-2 mb-6" />

          {/* ── SEÇÃO 2: Reflexão personalizada ──────────────────────────── */}
          <div className="mb-7 text-center">

            {/* Label centralizado */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              <span className="text-[13px] leading-none">✨</span>
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.16em]">
                Um pensamento pra você
              </span>
            </div>

            {/* Validação empática — suporte leve, menor e mais suave */}
            <p className="text-[13px] text-foreground/60 leading-relaxed mb-3 px-3">
              {line1}
            </p>

            {/* Pergunta reflexiva — mensagem principal, caixa azul */}
            <div className="mx-1 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3.5">
              <p className="text-[15px] font-semibold text-primary leading-snug">
                {line2}
              </p>
            </div>
          </div>

          {/* ── Ações por ícone ───────────────────────────────────────────── */}
          <div className="flex justify-center gap-8">

            <button
              onClick={() => { onClose(); navigate('/biblioteca'); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-active:scale-95"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
              >
                <BookHeart size={20} style={{ color: PRIMARY }} />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground/55 group-hover:text-muted-foreground/80 transition-colors">
                Biblioteca
              </span>
            </button>

            <button
              onClick={() => { onClose(); navigate('/padroes'); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-active:scale-95"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
              >
                <TrendingUp size={20} style={{ color: PRIMARY }} />
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
