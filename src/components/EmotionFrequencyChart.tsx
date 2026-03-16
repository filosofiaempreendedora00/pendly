import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { getEntries } from '@/lib/pendulum';

interface Props {
  refreshKey?: number;
}

const EmotionFrequencyChart = ({ refreshKey = 0 }: Props) => {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const entries = getEntries();
    const counts: Record<string, number> = {};

    for (const entry of entries) {
      if (entry.emotions) {
        for (const emotion of entry.emotions) {
          counts[emotion] = (counts[emotion] ?? 0) + 1;
        }
      }
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([emotion, count]) => ({ emotion, count }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (data.length === 0) return null;

  const max = data[0].count;
  const displayed = data.slice(0, 5);
  const hasMore = data.length > 5;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">
        Emo&#xE7;&#xF5;es predominantes
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Da mais &#xe0; menos frequente
      </p>

      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden mb-6">
        <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
          {displayed.map(({ emotion, count }, i) => (
            <div key={emotion} className="flex items-center gap-2.5">
              <span className="text-[9px] text-muted-foreground/30 w-3.5 text-right shrink-0 tabular-nums font-bold">
                {i + 1}
              </span>

              <span className="text-[11px] text-foreground/80 font-medium capitalize w-[90px] shrink-0 truncate">
                {emotion}
              </span>

              <div className="flex-1 relative h-3 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary/70"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>

              <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0 w-4 text-right font-medium">
                {count}
              </span>
            </div>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => navigate('/premium')}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-3 border-t border-border/20 text-[11px] text-muted-foreground/50 hover:text-primary active:text-primary transition-colors"
          >
            <Lock size={10} strokeWidth={2.5} />
            Ver todas as emo&#xE7;&#xF5;es
          </button>
        )}
      </div>
    </div>
  );
};

export default EmotionFrequencyChart;
