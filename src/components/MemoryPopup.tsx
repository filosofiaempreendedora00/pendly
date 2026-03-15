import { X, FileText, ImageIcon, Mic } from 'lucide-react';
import { PendulumEntry, getBobColor, getStatusLevel, PERIOD_CONFIG, DayPeriod } from '@/lib/pendulum';
import { generateInsight } from '@/lib/insights';

// ─── Lerp ────────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─── FaceSvg ─────────────────────────────────────────────────────────────────
const FaceSvg = ({ value }: { value: number }) => {
  const mouthCtrlY = lerp(13, 35, value / 100);
  const renderEyes = () => {
    if (value <= 11) return (
      <>
        <path d="M 10,11 L 16,14 L 10,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
        <path d="M 30,11 L 24,14 L 30,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
      </>
    );
    if (value >= 89) return (
      <>
        <path d="M 10,16 Q 13,11 16,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88" />
        <path d="M 24,16 Q 27,11 30,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88" />
      </>
    );
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
        d={`M 10,24 Q 20,${mouthCtrlY.toFixed(1)} 30,24`}
        stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88"
      />
    </svg>
  );
};

// ─── SpectrumBar ─────────────────────────────────────────────────────────────
const SpectrumBar = ({ position }: { position: number }) => {
  const color = getBobColor(position);
  return (
    <div className="relative h-2 rounded-full overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: `${position}%`, backgroundColor: color }} />
      <div className="absolute inset-y-0 right-0 rounded-r-full bg-muted" style={{ width: `${100 - position}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-background z-10"
        style={{ left: `${position}%`, backgroundColor: color }}
      />
    </div>
  );
};

// ─── Mood labels ─────────────────────────────────────────────────────────────
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
const getMoodLabel = (v: number) => MOODS.find(m => v <= m.max)?.label ?? 'Muuuito bem';

// ─── Date / time helpers ──────────────────────────────────────────────────────
const DIAS  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const formatEntryDate = (entry: PendulumEntry): string => {
  const [y, m, d] = entry.date.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]}, ${d} de ${MESES[m - 1]}`;
};

const formatEntryTime = (entry: PendulumEntry): string => {
  if (entry.timestamp) {
    const d = new Date(entry.timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  if (entry.period) return PERIOD_CONFIG[entry.period as DayPeriod].label;
  return '';
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface MemoryPopupProps {
  entry: PendulumEntry;
  onClose: () => void;
}

// ─── MemoryPopup ─────────────────────────────────────────────────────────────
const MemoryPopup = ({ entry, onClose }: MemoryPopupProps) => {
  const color      = getBobColor(entry.position);
  const moodLabel  = getMoodLabel(entry.position);
  const dateLabel  = formatEntryDate(entry);
  const timeLabel  = formatEntryTime(entry);
  const statusLevel = getStatusLevel(entry.position);
  const { line1, line2 } = generateInsight({
    statusLevel,
    position:  entry.position,
    emotions:  entry.emotions ?? [],
    note:      entry.note,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-border/30 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">

        {/* Scroll container */}
        <div className="max-h-[82vh] overflow-y-auto overscroll-contain">

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-7 h-7 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            <X size={13} />
          </button>

          {/* ── Hero: face + mood + date ─────────────────────────────────── */}
          <div className="flex flex-col items-center pt-7 pb-5 px-6">
            {/* Bob face */}
            <div
              className="relative w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: color, boxShadow: `0 6px 24px ${color}55` }}
            >
              <FaceSvg value={entry.position} />
            </div>

            {/* Mood label */}
            <span className="text-[20px] font-bold leading-none mb-1" style={{ color }}>
              {moodLabel}
            </span>

            {/* Date · time */}
            <span className="text-[12px] text-muted-foreground/50 font-medium mt-1">
              {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
            </span>
          </div>

          {/* Spectrum bar */}
          <div className="px-6 pb-5">
            <SpectrumBar position={entry.position} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wide">Baixo</span>
              <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wide">Alto</span>
            </div>
          </div>

          {/* ── Emotions ──────────────────────────────────────────────────── */}
          {entry.emotions && entry.emotions.length > 0 && (
            <>
              <div className="mx-6 border-t border-border/20 mb-4" />
              <div className="px-6 pb-4">
                <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-2.5">
                  Emoções
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.emotions.map(emotion => (
                    <span
                      key={emotion}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/12 text-primary border border-primary/20"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Note ─────────────────────────────────────────────────────── */}
          {entry.note && (
            <>
              <div className="mx-6 border-t border-border/20 mb-4" />
              <div className="px-6 pb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText size={11} className="text-muted-foreground/40" />
                  <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                    Registro
                  </p>
                </div>
                <p className="text-[14px] text-foreground/80 leading-relaxed">{entry.note}</p>
              </div>
            </>
          )}

          {/* ── Photo ────────────────────────────────────────────────────── */}
          {entry.photo && (
            <>
              <div className="mx-6 border-t border-border/20 mb-4" />
              <div className="px-6 pb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <ImageIcon size={11} className="text-muted-foreground/40" />
                  <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                    Foto
                  </p>
                </div>
                <img src={entry.photo} alt="" className="rounded-2xl w-full max-h-52 object-cover" />
              </div>
            </>
          )}

          {/* ── Audio ────────────────────────────────────────────────────── */}
          {entry.audio && (
            <>
              <div className="mx-6 border-t border-border/20 mb-4" />
              <div className="px-6 pb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Mic size={11} className="text-muted-foreground/40" />
                  <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                    Áudio
                  </p>
                </div>
                <audio src={entry.audio} controls className="w-full h-9" />
              </div>
            </>
          )}

          {/* ── Insight ──────────────────────────────────────────────────── */}
          <div className="mx-6 border-t border-border/20 mb-4" />
          <div className="px-6 pb-7">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[13px]">✨</span>
              <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                Pensamento do momento
              </p>
            </div>
            <p className="text-[13px] text-foreground/55 leading-relaxed mb-3">{line1}</p>
            <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3.5">
              <p className="text-[14px] font-semibold text-primary leading-snug">{line2}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MemoryPopup;
