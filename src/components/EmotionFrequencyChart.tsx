import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getEntries } from '@/lib/pendulum';

interface Props {
  refreshKey?: number;
}

const BLUR_LEVELS = [
  { blur: 2.5, opacity: 0.75 },
  { blur: 4.5, opacity: 0.55 },
  { blur: 7,   opacity: 0.38 },
];

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
  const visible  = data.slice(0, 5);
  const blurred  = data.slice(5, 8);
  const hasMore  = data.length > 5;

  const Row = ({
    emotion, count, index, blurLevel,
  }: {
    emotion: string; count: number; index: number; blurLevel?: { blur: number; opacity: number };
  }) => (
    <div
      className="flex items-center gap-2.5"
      style={
        blurLevel
          ? { filter: `blur(${blurLevel.blur}px)`, opacity: blurLevel.opacity, userSelect: 'none', pointerEvents: 'none' }
          : undefined
      }
    >
      <span className="text-[9px] text-muted-foreground/30 w-3.5 text-right shrink-0 tabular-nums font-bold">
        {index + 1}
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
  );

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">
        Emo&#xE7;&#xF5;es predominantes
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Da mais &#xe0; menos frequente
      </p>

      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden mb-6">
        {/* Visible rows */}
        <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
          {visible.map(({ emotion, count }, i) => (
            <Row key={emotion} emotion={emotion} count={count} index={i} />
          ))}
        </div>

        {/* Blurred rows + floating CTA */}
        {hasMore && (
          <div className="relative px-4 pb-5">
            {/* Blurred rows rendered behind */}
            <div className="flex flex-col gap-2.5">
              {blurred.map(({ emotion, count }, i) => (
                <Row
                  key={emotion}
                  emotion={emotion}
                  count={count}
                  index={5 + i}
                  blurLevel={BLUR_LEVELS[i]}
                />
              ))}
            </div>

            {/* Gradient fade from transparent → card */}
            <div className="absolute inset-0 bg-gradient-to-b from-card/10 via-card/60 to-card pointer-events-none rounded-b-2xl" />

            {/* Floating pill CTA */}
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => navigate('/premium')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/40 bg-card/80 backdrop-blur-sm text-primary text-[12px] font-semibold hover:bg-primary/10 hover:border-primary/70 active:scale-95 transition-all shadow-sm"
              >
                Ver meu perfil emocional completo
                <ChevronRight size={13} className="opacity-60" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionFrequencyChart;
