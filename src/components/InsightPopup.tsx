import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Scale, TrendingUp } from 'lucide-react';
import { generateInsight, type InsightInput } from '@/lib/insights';

// ─── Cor primária do app ──────────────────────────────────────────────────────
// Usa a variável CSS do tema para manter identidade visual
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
  radius: string; // '50%' = círculo, px = retângulo
  rotate: number;
}

// Paleta festiva mas suave, alinhada ao app
const CONFETTI_COLORS = [
  '#93c5fd', '#6ea8fe', '#a5b4fc',  // azuis
  '#86efac', '#6ee7b7',              // verdes
  '#fde68a', '#fbbf24',              // amarelos
  '#f9a8d4', '#c4b5fd',             // rosa / lilás
  '#ffffff',                          // branco
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

// ─── Som de torcida sintetizado via Web Audio API ─────────────────────────────
const playSuccessSound = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx  = new AudioCtx();
    const sr   = ctx.sampleRate;
    const dur  = 2.2;

    // ── Ruído de multidão ──
    const buf = ctx.createBuffer(2, Math.ceil(sr * dur), sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) {
        const t = i / sr;
        const noise = Math.random() * 2 - 1;
        // Modulação orgânica: simula irregularidade de palmas/vozes
        const mod =
          0.50 +
          0.18 * Math.sin(t * 8.3  + ch * 0.9) +
          0.15 * Math.sin(t * 5.7) +
          0.12 * Math.sin(t * 14.1 + ch * 0.5) +
          0.05 * (Math.random() - 0.5);
        // Envelope: ataque rápido, sustain, decay exponencial
        const attack = Math.min(t / 0.07, 1);
        const decay  = Math.exp(-Math.max(t - 0.15, 0) * 1.4);
        d[i] = noise * mod * attack * decay * 0.42;
      }
    }

    const crowd = ctx.createBufferSource();
    crowd.buffer = buf;

    // Bandpass para soar como multidão (corta sub-grave e agudo excessivo)
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 450;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3800;

    const crowdGain = ctx.createGain();
    crowdGain.gain.setValueAtTime(0.55, ctx.currentTime);
    crowdGain.gain.setValueAtTime(0.55, ctx.currentTime + 0.25);
    crowdGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    crowd.connect(hp);
    hp.connect(lp);
    lp.connect(crowdGain);
    crowdGain.connect(ctx.destination);
    crowd.start();
    crowd.stop(ctx.currentTime + dur);

    // ── "Pop" inicial (como estouro de confete) ──
    const popBuf = ctx.createBuffer(1, Math.ceil(sr * 0.06), sr);
    const pd = popBuf.getChannelData(0);
    for (let i = 0; i < pd.length; i++) {
      pd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.008));
    }
    const pop     = ctx.createBufferSource();
    pop.buffer    = popBuf;
    const popGain = ctx.createGain();
    popGain.gain.value = 0.35;
    pop.connect(popGain);
    popGain.connect(ctx.destination);
    pop.start();
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
      const t = setTimeout(playSuccessSound, 60);
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

        {/* Linha de acento no topo — cor primária do app */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(to right, transparent, ${PRIMARY}, transparent)`,
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

            {/* Ícone de check com confetti */}
            <div
              className="relative flex items-center justify-center mb-4"
              style={{ width: 96, height: 96 }}
            >
              {/* Partículas de confetti */}
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

              {/* Círculo preenchido grande com checkmark */}
              <div
                className="check-ring w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  backgroundColor: PRIMARY,
                  boxShadow: `0 8px 28px hsl(var(--primary) / 0.35)`,
                }}
              >
                <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M10 20.5 L17 28 L30 13"
                    stroke="white"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="checkmark-path"
                  />
                </svg>
              </div>
            </div>

            {/* Texto de confirmação — só um, sem repetição */}
            <p className="text-[16px] font-semibold text-foreground">
              Registro realizado!
            </p>
          </div>

          {/* Divisor */}
          <div className="h-px bg-border/50 mb-5" />

          {/* ── SEÇÃO 2: Reflexão personalizada ──────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[13px] leading-none">✨</span>
              <span className="text-[10.5px] font-semibold text-muted-foreground/55 uppercase tracking-[0.15em]">
                Um pensamento pra você
              </span>
            </div>

            <p className="text-[15px] leading-relaxed text-foreground font-medium">
              {line1}
            </p>
            <p className="text-[15px] leading-relaxed text-foreground/60 mt-2">
              {line2}
            </p>
          </div>

          {/* ── Navegação por ícones em bolinhas ─────────────────────────── */}
          <div className="flex justify-center gap-10">

            <button
              onClick={() => { onClose(); navigate('/equilibrio'); }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 group-hover:scale-105 group-active:scale-95"
                style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
              >
                <Scale size={20} style={{ color: PRIMARY }} />
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
