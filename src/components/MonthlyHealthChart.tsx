import { useState, useMemo } from 'react';
import { getEntries, getLocalDateKey, getBobColor, PendulumEntry } from '@/lib/pendulum';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// 9 estados — exatamente os mesmos da tela do pêndulo, do pior ao melhor.
// repPos: posição representativa usada pra gerar a cor do chip na legenda.
const MOODS = [
  { label: 'Muuuito mal',   max: 11,  repPos: 5  },
  { label: 'Muuito mal',    max: 22,  repPos: 16 },
  { label: 'Muito mal',     max: 33,  repPos: 27 },
  { label: 'Mal',           max: 44,  repPos: 38 },
  { label: 'Mais ou menos', max: 56,  repPos: 50 },
  { label: 'Bem',           max: 67,  repPos: 61 },
  { label: 'Muito bem',     max: 78,  repPos: 72 },
  { label: 'Muuito bem',    max: 89,  repPos: 83 },
  { label: 'Muuuito bem',   max: 100, repPos: 95 },
] as const;

const getStatusLevel = (pos: number): number =>
  MOODS.findIndex(m => pos <= m.max);

// ─── FaceMini — carinha minúscula para o grid mensal ─────────────────────────
const FaceMini = ({ value }: { value: number }) => {
  const mouthCtrlY = lerp(13, 35, value / 100);
  const renderEyes = () => {
    if (value <= 11) return (
      <>
        <path d="M 10,11 L 16,14 L 10,17" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
        <path d="M 30,11 L 24,14 L 30,17" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.92" />
      </>
    );
    if (value >= 89) return (
      <>
        <path d="M 10,16 Q 13,11 16,16" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.92" />
        <path d="M 24,16 Q 27,11 30,16" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.92" />
      </>
    );
    const eyeRY = value > 78 ? 2 : 3;
    const eyeY  = value > 78 ? 15 : 14;
    return (
      <>
        <ellipse cx="13" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.92" />
        <ellipse cx="27" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.92" />
      </>
    );
  };
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {renderEyes()}
      <path
        d={`M 10,24 Q 20,${mouthCtrlY.toFixed(1)} 30,24`}
        stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" opacity="0.92"
      />
    </svg>
  );
};

// ─── DayFaces — carinhas sobrepostas por dia ──────────────────────────────────
// Faces ainda mais sobrepostas que no painel de 7 dias (FACE_OFFSET menor)
// para caber no grid mensal sem invadir células vizinhas.
const FACE_SIZE   = 15;  // px
const FACE_OFFSET = 5;   // px — sobreposição bem apertada

const DayFaces = ({ entries }: { entries: PendulumEntry[] }) => {
  const shown  = entries.slice(0, 3);            // máx 3, mais recente primeiro
  const totalW = FACE_SIZE + (shown.length - 1) * FACE_OFFSET;
  return (
    <div className="relative" style={{ width: totalW, height: FACE_SIZE }}>
      {shown.map((e, i) => (
        <div
          key={i}
          className="absolute rounded-full border-[1px] border-background"
          style={{
            width:           FACE_SIZE,
            height:          FACE_SIZE,
            left:            i * FACE_OFFSET,
            zIndex:          shown.length - i,   // i=0 (mais recente) na frente
            backgroundColor: getBobColor(e.position),
          }}
        >
          <FaceMini value={e.position} />
        </div>
      ))}
    </div>
  );
};

// ─── MonthlyHealthChart ───────────────────────────────────────────────────────
const MonthlyHealthChart = () => {
  const today = new Date();

  const [navYear,       setNavYear]       = useState(today.getFullYear());
  const [navMonth,      setNavMonth]      = useState(today.getMonth());
  const [hiddenLevels,  setHiddenLevels]  = useState<Set<number>>(new Set());

  // Está no mês real atual? (impede navegar pro futuro)
  const realYear      = today.getFullYear();
  const realMonth     = today.getMonth();
  const isAtCurrent   = navYear === realYear && navMonth === realMonth;

  const toggleLevel = (level: number) =>
    setHiddenLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level); else next.add(level);
      return next;
    });

  const goToPrev = () => {
    if (navMonth === 0) { setNavYear(y => y - 1); setNavMonth(11); }
    else setNavMonth(m => m - 1);
  };
  const goToNext = () => {
    if (isAtCurrent) return;
    if (navMonth === 11) { setNavYear(y => y + 1); setNavMonth(0); }
    else setNavMonth(m => m + 1);
  };

  const { dayMap, daysInMonth, firstWeekday, todayDate } = useMemo(() => {
    const entries      = getEntries();
    const daysInMonth  = new Date(navYear, navMonth + 1, 0).getDate();
    const firstWeekday = new Date(navYear, navMonth, 1).getDay();
    // todayDate só é válido no mês atual
    const _now         = new Date();
    const todayDate    = (navYear === _now.getFullYear() && navMonth === _now.getMonth())
      ? _now.getDate()
      : -1;

    // dayMap: dia → entradas ordenadas da mais recente pra mais antiga
    const dayMap = new Map<number, PendulumEntry[]>();
    const d = new Date(navYear, navMonth, 1);
    for (let day = 1; day <= daysInMonth; day++) {
      d.setDate(day);
      const key        = getLocalDateKey(d);
      const dayEntries = entries
        .filter(e => e.date === key)
        .sort((a, b) => (b.timestamp ?? '').localeCompare(a.timestamp ?? ''));
      if (dayEntries.length > 0) dayMap.set(day, dayEntries);
    }
    return { dayMap, daysInMonth, firstWeekday, todayDate };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navYear, navMonth]);

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-10">

      {/* ── Cabeçalho + passador de mês ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-foreground tracking-tight">
          Saúde mental no mês
        </h2>
        <div className="flex items-center gap-0.5">
          <button
            onClick={goToPrev}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/60 hover:bg-muted active:bg-muted/80 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[11px] font-semibold text-muted-foreground/60 w-[84px] text-center">
            {MONTH_NAMES[navMonth].slice(0, 3)} {navYear}
          </span>
          <button
            onClick={goToNext}
            disabled={isAtCurrent}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isAtCurrent
                ? 'opacity-20 cursor-default'
                : 'text-muted-foreground/60 hover:bg-muted active:bg-muted/80'
            }`}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Toque nos estados para filtrar o gráfico.
      </p>

      {/* ── Legenda filtrável — do pior ao melhor ───────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {MOODS.map((mood, level) => {
          const color    = getBobColor(mood.repPos);
          const isHidden = hiddenLevels.has(level);
          return (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className="px-2.5 py-1 rounded-full transition-all duration-150 active:scale-95"
              style={{
                fontSize:        9,
                fontWeight:      600,
                letterSpacing:   '0.025em',
                backgroundColor: isHidden ? 'transparent' : `${color}1e`,
                color:           isHidden ? 'hsl(var(--muted-foreground))' : color,
                border:          `1.5px solid ${isHidden ? 'hsl(var(--border))' : `${color}55`}`,
                opacity:         isHidden ? 0.40 : 1,
              }}
            >
              {mood.label}
            </button>
          );
        })}
      </div>

      {/* ── Grid do calendário ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card p-4">

        {/* Cabeçalhos dos dias da semana */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="flex items-center justify-center">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Células dos dias */}
        <div className="grid grid-cols-7 gap-y-1.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`empty-${idx}`} />;

            const isToday        = day === todayDate;
            const isFuture       = isAtCurrent && day > todayDate;
            const allEntries     = dayMap.get(day) ?? [];
            const visibleEntries = allEntries.filter(
              e => !hiddenLevels.has(getStatusLevel(e.position)),
            );

            return (
              <div
                key={day}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-xl ${
                  isToday ? 'bg-primary/10' : ''
                }`}
              >
                {/* Número do dia */}
                <span className={`text-[10px] leading-none ${
                  isToday
                    ? 'font-bold text-primary'
                    : isFuture
                    ? 'text-muted-foreground/20'
                    : allEntries.length > 0
                    ? 'font-medium text-foreground/60'
                    : 'text-muted-foreground/30'
                }`}>
                  {day}
                </span>

                {/* Carinhas ou indicador vazio */}
                <div className="h-[17px] flex items-center justify-center">
                  {visibleEntries.length > 0 ? (
                    <DayFaces entries={visibleEntries} />
                  ) : !isFuture && allEntries.length === 0 ? (
                    <div className="w-1 h-1 rounded-full bg-muted/40" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso se não há dados no mês navegado */}
        {dayMap.size === 0 && (
          <p className="text-center text-[11px] text-muted-foreground/35 mt-3 pb-1">
            Nenhum registro em {MONTH_NAMES[navMonth].toLowerCase()}.
          </p>
        )}
      </div>
    </div>
  );
};

export default MonthlyHealthChart;
