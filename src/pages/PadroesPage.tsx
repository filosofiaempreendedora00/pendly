import { useMemo, useState } from 'react';
import { getEntries, getAveragePosition, getLocalDateKey, PendulumEntry, getBobColor } from '@/lib/pendulum';
import { TrendingUp } from 'lucide-react';
import MonthlyHealthChart from '@/components/MonthlyHealthChart';
import MemoryPopup from '@/components/MemoryPopup';

const DAYS   = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// ─── Mood labels (mesma tabela do Pêndulo e da Biblioteca) ───────────────────
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

// ─── Lerp (usado pelo FaceSvg e SpectrumBar) ─────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// getBobColor é importado de @/lib/pendulum — fonte única da verdade

// ─── FaceSvg — idêntico ao Pêndulo e à Biblioteca ───────────────────────────
// Regra da boca: ctrlY < endY → arco pra cima → ⌢ → triste (bad)
//                ctrlY > endY → arco pra baixo → ⌣ → sorriso (good)
const FaceSvg = ({ value }: { value: number }) => {
  const mouthCtrlY = lerp(13, 35, value / 100); // 13=triste, 35=sorriso, 24=reto
  const renderEyes = () => {
    if (value <= 11) return (                          // chevron ">" "<" — raiva/tristeza intensa
      <>
        <path d="M 10,11 L 16,14 L 10,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
        <path d="M 30,11 L 24,14 L 30,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
      </>
    );
    if (value >= 89) return (                          // arco superior — felicidade intensa
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
    <div className="flex-1 relative h-1.5 rounded-full overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: `${position}%`, backgroundColor: color }} />
      <div className="absolute inset-y-0 right-0 rounded-r-full bg-muted" style={{ width: `${100 - position}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-background z-10"
        style={{ left: `${position}%`, backgroundColor: color }}
      />
    </div>
  );
};

// ─── StackedFaces ─────────────────────────────────────────────────────────────
// Ordem: mais recente na esquerda (i=0) e na frente (z-index maior)
const FACE_SIZE = 20;
const OFFSET    = 9; // px entre faces — mais próximas que antes

const StackedFaces = ({ entries }: { entries: PendulumEntry[] }) => {
  const shown  = entries.slice(0, 3);            // máx 3, já ordenado: [mais_recente, ...]
  const totalW = FACE_SIZE + (shown.length - 1) * OFFSET;

  if (shown.length === 0) {
    return <div className="w-5 h-5 rounded-full bg-muted/60" />;
  }

  return (
    <div className="relative" style={{ width: totalW, height: FACE_SIZE }}>
      {shown.map((e, i) => (
        <div
          key={i}
          className="absolute rounded-full border-[1.5px] border-background"
          style={{
            width:           FACE_SIZE,
            height:          FACE_SIZE,
            left:            i * OFFSET,
            zIndex:          shown.length - i,   // i=0 (mais recente) fica na frente
            backgroundColor: getBobColor(e.position),
          }}
        >
          <FaceSvg value={e.position} />
        </div>
      ))}
    </div>
  );
};

// ─── Horário ──────────────────────────────────────────────────────────────────
const formatTime = (entry: PendulumEntry): string => {
  if (!entry.timestamp) return '';
  const d = new Date(entry.timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ─── PadroesPage ─────────────────────────────────────────────────────────────
const PadroesPage = () => {
  const [expandedDay, setExpandedDay]       = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry]   = useState<PendulumEntry | null>(null);

  const weekData = useMemo(() => {
    const entries = getEntries();
    const today   = new Date();
    const days: {
      label:       string;
      dateLabel:   string;
      date:        string;
      entries:     PendulumEntry[];
      avgPosition?: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d   = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      // Mais recente primeiro
      const dayEntries = entries
        .filter(e => e.date === key)
        .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));

      days.push({
        label:       DAYS[d.getDay()],
        dateLabel:   `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        date:        key,
        entries:     dayEntries,
        avgPosition: dayEntries.length > 0 ? getAveragePosition(dayEntries) : undefined,
      });
    }
    return days;
  }, []);

  const hasAnyData   = weekData.some(d => d.entries.length > 0);
  const expandedData = weekData.find(d => d.date === expandedDay) ?? null;

  return (
    <div className="flex flex-col min-h-screen pb-24 px-4 pt-16 bg-muted/30">
      <div className="px-2 mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-1 tracking-tight">Evolução</h1>
        <p className="text-sm text-muted-foreground">Seus últimos 7 dias</p>
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-8">
          <TrendingUp size={40} className="text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground">
            Registre seu pêndulo diariamente para descobrir seus padrões emocionais.
          </p>
        </div>
      ) : (
        <>
          {/* ── Bolhas dos 7 dias ─────────────────────────────────────────── */}
          <div className="flex gap-1.5 mb-3">
            {weekData.map(({ label, dateLabel, date, entries: dayEntries }) => {
              const isToday    = date === getLocalDateKey();
              const hasEntries = dayEntries.length > 0;
              const isSelected = expandedDay === date;
              const dayNum     = dateLabel.split(' ')[0];
              const monthAbbr  = dateLabel.split(' ')[1];

              return (
                <button
                  key={date}
                  onClick={() => hasEntries && setExpandedDay(isSelected ? null : date)}
                  className={`flex flex-col items-center gap-1.5 flex-1 py-2.5 px-1 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/20'
                      : isToday
                      ? 'bg-accent/50'
                      : 'bg-card'
                  } ${hasEntries ? 'cursor-pointer active:scale-95' : 'opacity-35 cursor-default'}`}
                >
                  <span className={`text-[9px] font-semibold tracking-wide uppercase leading-none ${
                    isSelected || isToday ? 'text-primary' : 'text-muted-foreground/60'
                  }`}>
                    {label}
                  </span>

                  {/* Carinhas sobrepostas */}
                  <div className="flex items-center justify-center my-0.5 h-6">
                    <StackedFaces entries={dayEntries} />
                  </div>

                  {/* Data */}
                  <div className="flex flex-col items-center leading-none gap-px">
                    <span className={`text-[11px] font-semibold ${
                      isSelected || isToday ? 'text-primary' : 'text-muted-foreground/60'
                    }`}>{dayNum}</span>
                    <span className={`text-[8px] uppercase tracking-wide ${
                      isSelected || isToday ? 'text-primary/60' : 'text-muted-foreground/35'
                    }`}>{monthAbbr}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Detalhe do dia expandido ──────────────────────────────────── */}
          {expandedData && expandedData.entries.length > 0 && (
            <div className="rounded-2xl bg-card border border-border/30 overflow-hidden mb-6 animate-in slide-in-from-top-1 duration-200">
              <div className="px-4 pt-3 pb-2 flex items-baseline gap-2 border-b border-border/20">
                <span className="text-[13px] font-bold text-foreground">{expandedData.label}</span>
                <span className="text-[11px] text-muted-foreground/50 font-medium">{expandedData.dateLabel}</span>
              </div>

              <div className="px-4 py-3 flex flex-col gap-4">
                {expandedData.entries.map((entry, i) => {
                  const color = getBobColor(entry.position);
                  const time  = formatTime(entry);
                  const mood  = getMoodLabel(entry.position);

                  return (
                    <div key={i} className="flex items-center gap-3">
                      {/* Carinha */}
                      <div
                        className="relative w-9 h-9 rounded-full shrink-0"
                        style={{ backgroundColor: color, boxShadow: `0 2px 8px ${color}50` }}
                      >
                        <FaceSvg value={entry.position} />
                      </div>

                      {/* Barra + mood + horário */}
                      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                        <SpectrumBar position={entry.position} />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground/50 leading-none">{mood}</span>
                          {time && <span className="text-[9px] text-muted-foreground/35 leading-none">{time}</span>}
                        </div>
                      </div>

                      {/* CTA elegante */}
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/15 text-primary text-[10px] font-medium shrink-0 active:bg-primary/20 transition-colors"
                      >
                        <span>Ver memória</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saúde mental no mês */}
          <div className="px-2">
            <MonthlyHealthChart />
          </div>
        </>
      )}

      {/* Memory detail popup */}
      {selectedEntry && (
        <MemoryPopup
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};

export default PadroesPage;
