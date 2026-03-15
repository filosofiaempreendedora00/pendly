import { useMemo, useState } from 'react';
import { getEntries, getZoneLabel, getZone, getAveragePosition, DayPeriod, PERIOD_CONFIG, getBobColor, ZONES, getLocalDateKey } from '@/lib/pendulum';
import { TrendingUp, Sunrise, Sun, Moon, ChevronDown } from 'lucide-react';
import MonthlyHealthChart from '@/components/MonthlyHealthChart';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const PERIOD_ICONS: Record<DayPeriod, (size?: number) => React.ReactNode> = {
  morning: (size = 12) => <Sunrise size={size} className="text-primary" />,
  afternoon: (size = 12) => <Sun size={size} className="text-primary" />,
  night: (size = 12) => <Moon size={size} className="text-primary" />,
};

const PERIOD_ORDER: DayPeriod[] = ['morning', 'afternoon', 'night'];

const SpectrumBar = ({ position, size = 'normal' }: { position: number; size?: 'normal' | 'small' }) => {
  const h = size === 'small' ? 'h-1.5' : 'h-2';
  const dotSize = size === 'small' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const bobColor = getBobColor(position);

  return (
    <div className={`flex-1 relative ${h} rounded-full overflow-hidden`}>
      <div
        className="absolute inset-y-0 left-0 rounded-l-full"
        style={{ width: `${position}%`, backgroundColor: bobColor }}
      />
      <div
        className="absolute inset-y-0 right-0 rounded-r-full bg-muted"
        style={{ width: `${100 - position}%` }}
      />
      <div
        className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 ${dotSize} rounded-full border-2 border-background z-10`}
        style={{ left: `${position}%`, backgroundColor: bobColor }}
      />
    </div>
  );
};

/* ── Saúde mental por turno – grouped by health zones ── */
const HEALTH_ZONES = [
  { key: 'healthy', label: 'Zona saudável', color: 'hsl(152, 38%, 42%)', check: (p: number) => (p >= 15 && p <= 85) && !(p < 15 || p > 85) },
  { key: 'alert', label: 'Zona de alerta', color: 'hsl(40, 58%, 48%)', check: (_p: number) => false },
  { key: 'critical', label: 'Zona crítica', color: 'hsl(8, 83%, 38%)', check: (p: number) => p < 15 || p > 85 },
];

function classifyPosition(position: number): 'healthy' | 'alert' | 'critical' {
  // Autocompaixão [15-35], Equilíbrio [35-65], Autorresponsabilidade [65-85]
  if (position >= 15 && position <= 85) {
    // Check if in transition zones (borders between safe and danger)
    // Zones: 0-15 danger, 15-35 safe, 35-65 neutral, 65-85 safe, 85-100 danger
    // Alert = transition areas near danger
    if (position >= 15 && position < 22) return 'alert';
    if (position > 78 && position <= 85) return 'alert';
    return 'healthy';
  }
  return 'critical';
}

const ZONE_COLORS = {
  healthy: 'hsl(152, 38%, 42%)',
  alert: 'hsl(40, 58%, 48%)',
  critical: 'hsl(8, 83%, 38%)',
};

const ZONE_LABELS = {
  healthy: 'Saudável',
  alert: 'Alerta',
  critical: 'Crítica',
};

const MoodByPeriodChart = () => {
  const data = useMemo(() => {
    const entries = getEntries();
    return PERIOD_ORDER.map((period) => {
      const periodEntries = entries.filter(e => e.period === period);
      const counts = { healthy: 0, alert: 0, critical: 0 };
      periodEntries.forEach(e => { counts[classifyPosition(e.position)]++; });
      return { period, counts, total: periodEntries.length };
    });
  }, []);

  const hasData = data.some(d => d.total > 0);
  if (!hasData) return null;

  const zoneKeys: ('healthy' | 'alert' | 'critical')[] = ['healthy', 'alert', 'critical'];

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-foreground mb-1 tracking-tight">
        Saúde mental por turno
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Proporção de registros por zona de saúde em cada período do dia.
      </p>

      <div className="flex flex-col gap-3">
        {data.map(({ period, counts, total }) => {
          const pcts = {
            healthy: total > 0 ? Math.round((counts.healthy / total) * 100) : 0,
            alert: total > 0 ? Math.round((counts.alert / total) * 100) : 0,
            critical: total > 0 ? Math.round((counts.critical / total) * 100) : 0,
          };

          return (
            <div key={period} className="rounded-2xl bg-card p-4">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                {PERIOD_ICONS[period](14)}
                <span className="text-sm font-semibold text-foreground">
                  {PERIOD_CONFIG[period].label}
                </span>
                <span className="text-[10px] text-muted-foreground/50 ml-auto">
                  {total} {total === 1 ? 'registro' : 'registros'}
                </span>
              </div>

              {total === 0 ? (
                <div className="h-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/40">sem dados</span>
                </div>
              ) : (
                <>
                  {/* Stacked bar */}
                  <div className="flex h-6 rounded-full overflow-hidden gap-px">
                    {zoneKeys.map((key) => {
                      if (counts[key] === 0) return null;
                      const pct = (counts[key] / total) * 100;
                      return (
                        <div
                          key={key}
                          className="relative flex items-center justify-center min-w-[20px] transition-all duration-300"
                          style={{ width: `${pct}%`, backgroundColor: ZONE_COLORS[key] }}
                        >
                          {pct >= 15 && (
                            <span className="text-[10px] font-bold text-white drop-shadow-sm">
                              {pcts[key]}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend with percentages */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {zoneKeys.map((key) => {
                      if (counts[key] === 0) return null;
                      return (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[key] }} />
                          <span className="text-[10px] text-muted-foreground leading-none">
                            {ZONE_LABELS[key]} · {pcts[key]}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PadroesPage = () => {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const weekData = useMemo(() => {
    const entries = getEntries();
    const today = new Date();
    const days: { label: string; dateLabel: string; date: string; entries: { position: number; period?: DayPeriod }[]; avgPosition?: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const dayEntries = entries.filter((e) => e.date === key);
      
      days.push({
        label: DAYS[d.getDay()],
        dateLabel: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        date: key,
        entries: dayEntries.map(e => ({ position: e.position, period: e.period })),
        avgPosition: dayEntries.length > 0 ? getAveragePosition(dayEntries) : undefined,
      });
    }
    return days;
  }, []);

  const hasAnyData = weekData.some((d) => d.entries.length > 0);
  const expandedDayData = weekData.find(d => d.date === expandedDay) ?? null;

  return (
    <div className="flex flex-col min-h-screen pb-24 px-6 pt-16 bg-muted/30">
      <h1 className="text-2xl font-semibold text-foreground mb-1 tracking-tight">
        Evolução
      </h1>
      <p className="text-sm text-muted-foreground mb-10">
        Seus últimos 7 dias
      </p>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <TrendingUp size={40} className="text-muted-foreground/30 mb-4" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Registre seu pêndulo diariamente para descobrir seus padrões emocionais.
          </p>
        </div>
      ) : (
        <>
          {/* 7-day bubbles */}
          <div className="flex gap-1.5 mb-3">
            {weekData.map(({ label, dateLabel, date, entries: dayEntries, avgPosition }) => {
              const isToday = date === getLocalDateKey();
              const hasEntries = dayEntries.length > 0;
              const isSelected = expandedDay === date;
              const dotColor = avgPosition !== undefined ? getBobColor(avgPosition) : null;
              const dayNum = dateLabel.split(' ')[0];

              return (
                <button
                  key={date}
                  onClick={() => hasEntries && setExpandedDay(isSelected ? null : date)}
                  className={`flex flex-col items-center gap-1 flex-1 py-2.5 rounded-2xl transition-all ${
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

                  <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center my-0.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: dotColor ?? 'hsl(220,10%,82%)' }}
                    />
                  </div>

                  <div className="flex flex-col items-center leading-none gap-px">
                    <span className={`text-[11px] font-semibold ${
                      isSelected || isToday ? 'text-primary' : 'text-muted-foreground/60'
                    }`}>
                      {dayNum}
                    </span>
                    <span className={`text-[8px] uppercase tracking-wide ${
                      isSelected || isToday ? 'text-primary/60' : 'text-muted-foreground/35'
                    }`}>
                      {dateLabel.split(' ')[1]}
                    </span>
                  </div>

                  {hasEntries && (
                    <ChevronDown
                      size={10}
                      className={`transition-transform duration-200 ${
                        isSelected
                          ? 'rotate-180 text-primary/60'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Expanded day detail card */}
          {expandedDayData && expandedDayData.entries.length > 0 && (
            <div className="rounded-2xl bg-card p-4 mb-6 animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center mb-3">
                <span className="text-sm font-semibold text-foreground">
                  {expandedDayData.label}
                </span>
                <span className="font-normal text-muted-foreground/50 ml-1.5 text-xs">
                  {expandedDayData.dateLabel}
                </span>
              </div>

              <div className="flex flex-col divide-y divide-border/30 pt-1">
                {PERIOD_ORDER.map((period) => {
                  const subEntry = expandedDayData.entries.find(e => e.period === period);
                  return (
                    <div key={period} className="flex items-center gap-3 py-2.5 min-h-[2.75rem]">
                      {/* Turno */}
                      <div className="flex items-center gap-1.5 w-16 shrink-0">
                        {PERIOD_ICONS[period](12)}
                        <span className="text-xs font-medium text-foreground/70">
                          {PERIOD_CONFIG[period].label}
                        </span>
                      </div>
                      {/* Barra */}
                      <div className="flex-1">
                        {subEntry ? (
                          <SpectrumBar position={subEntry.position} size="small" />
                        ) : (
                          <div className="h-1.5 rounded-full bg-muted/50" />
                        )}
                      </div>
                      {/* Label da zona */}
                      <span className={`text-[10px] leading-tight text-right w-24 shrink-0 ${
                        subEntry ? 'text-muted-foreground/60' : 'text-muted-foreground/25'
                      }`}>
                        {subEntry ? getZoneLabel(subEntry.position) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Saúde mental por turno */}
          <MoodByPeriodChart />

          {/* Saúde mental no mês */}
          <MonthlyHealthChart />
        </>
      )}
    </div>
  );
};

export default PadroesPage;
