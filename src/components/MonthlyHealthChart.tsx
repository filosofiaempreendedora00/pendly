import { useMemo } from 'react';
import { getEntries, getLocalDateKey } from '@/lib/pendulum';

function classifyPosition(position: number): 'healthy' | 'alert' | 'critical' {
  if (position >= 22 && position <= 78) return 'healthy';
  if ((position >= 15 && position < 22) || (position > 78 && position <= 85)) return 'alert';
  return 'critical';
}

const ZONE_PRIORITY = { critical: 2, alert: 1, healthy: 0 } as const;

const ZONE_COLORS = {
  healthy: 'hsl(152, 38%, 42%)',
  alert:   'hsl(40,  58%, 48%)',
  critical:'hsl(8,   83%, 38%)',
};

const ZONE_LABELS = { healthy: 'Saudável', alert: 'Alerta', critical: 'Crítica' };

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

type Zone = 'healthy' | 'alert' | 'critical';

const MonthlyHealthChart = () => {
  const { dayMap, year, month, daysInMonth, firstWeekday, todayDate } = useMemo(() => {
    const entries = getEntries();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun

    // Build map: dateKey → worst zone
    const dayMap = new Map<number, Zone>();

    entries.forEach(e => {
      const d = new Date(year, month, 1);
      for (let day = 1; day <= daysInMonth; day++) {
        d.setDate(day);
        if (getLocalDateKey(d) === e.date) {
          const zone = classifyPosition(e.position);
          const existing = dayMap.get(day);
          if (!existing || ZONE_PRIORITY[zone] > ZONE_PRIORITY[existing]) {
            dayMap.set(day, zone);
          }
        }
      }
    });

    return { dayMap, year, month, daysInMonth, firstWeekday, todayDate };
  }, []);

  const hasData = dayMap.size > 0;
  if (!hasData) return null;

  // Build calendar cells: nulls for leading empty slots, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-foreground mb-1 tracking-tight">
        Saúde mental no mês
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Sua zona de saúde em cada dia de {MONTH_NAMES[month]}.
      </p>

      <div className="rounded-2xl bg-card p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="flex items-center justify-center">
              <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wide">
                {d}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} />;
            }

            const isToday = day === todayDate;
            const isFuture = day > todayDate;
            const zone = dayMap.get(day);

            return (
              <div
                key={day}
                className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-colors ${
                  isToday ? 'bg-primary/10' : ''
                }`}
              >
                <span
                  className={`text-[11px] font-medium leading-none ${
                    isToday
                      ? 'text-primary font-semibold'
                      : isFuture
                      ? 'text-muted-foreground/25'
                      : zone
                      ? 'text-foreground/70'
                      : 'text-muted-foreground/40'
                  }`}
                >
                  {day}
                </span>

                {/* Dot */}
                <div className="h-2 flex items-center justify-center">
                  {zone ? (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ZONE_COLORS[zone] }}
                    />
                  ) : !isFuture ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-muted/60" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 justify-center">
          {(['critical', 'alert', 'healthy'] as Zone[]).map(key => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ZONE_COLORS[key] }} />
              <span className="text-[10px] text-muted-foreground">{ZONE_LABELS[key]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyHealthChart;
