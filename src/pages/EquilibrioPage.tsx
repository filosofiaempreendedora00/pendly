import { useState, useEffect } from 'react';
import { getEntriesForDate, getTodayKey, getAveragePosition } from '@/lib/pendulum';
import { generateInterventionSession, InterventionCard, TipoIntervencao } from '@/lib/interventions';
import { Button } from '@/components/ui/button';
import { Check, Leaf, MessageCircle, Sparkles, Zap, Wind } from 'lucide-react';

// ─── Tipo configuration (icon + label per intervention type) ─────────────────

const TIPO_CONFIG: Record<TipoIntervencao, {
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
}> = {
  pergunta: {
    label: 'Reflexão',
    icon: <MessageCircle size={13} />,
    badgeClass: 'text-primary bg-primary/10',
  },
  reframing: {
    label: 'Novo olhar',
    icon: <Sparkles size={13} />,
    badgeClass: 'text-violet-600 bg-violet-500/10',
  },
  micro_acao: {
    label: 'Ação pequena',
    icon: <Zap size={13} />,
    badgeClass: 'text-amber-600 bg-amber-500/10',
  },
  respiracao: {
    label: 'Respiração',
    icon: <Wind size={13} />,
    badgeClass: 'text-sky-600 bg-sky-500/10',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const EquilibrioPage = () => {
  const [position, setPosition] = useState<number | null>(null);
  const [session, setSession] = useState<InterventionCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const todayEntries = getEntriesForDate(getTodayKey());
    if (todayEntries.length > 0) {
      const pos = getAveragePosition(todayEntries);
      setPosition(pos);
      setSession(generateInterventionSession(pos));
    }
  }, []);

  // ── No pendulum registered yet ────────────────────────────────────────────
  if (position === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-24 px-6 text-center">
        <Leaf size={40} className="text-primary/40 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Registre seu pêndulo primeiro
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Vá até a tela Pêndulo e registre como você está se sentindo agora.
        </p>
      </div>
    );
  }

  // ── Session completed ─────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-24 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-5">
          <Check size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Sessão concluída
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Pequenos ajustes ajudam seu pêndulo a voltar ao eixo.
        </p>
      </div>
    );
  }

  const card = session[currentIdx];
  if (!card) return null;

  const tipo     = TIPO_CONFIG[card.tipo];
  const isLast   = currentIdx === session.length - 1;
  const total    = session.length;

  const handleContinuar = () => {
    setFading(true);
    setTimeout(() => {
      if (isLast) {
        setCompleted(true);
      } else {
        setCurrentIdx(prev => prev + 1);
      }
      setFading(false);
    }, 180);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 px-6 pt-14 pb-36 overflow-y-auto">

        {/* Progress bar — one segment per intervention */}
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= currentIdx ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Card — fades between transitions */}
        <div
          className={`flex flex-col gap-7 transition-opacity duration-200 ${
            fading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Tipo badge */}
          <span className={`inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-full text-xs font-medium ${tipo.badgeClass}`}>
            {tipo.icon}
            {tipo.label}
          </span>

          {/* Intervention text */}
          <p className="text-[1.2rem] font-medium text-foreground leading-relaxed">
            {card.texto}
          </p>
        </div>
      </div>

      {/* Gradient fade behind button */}
      <div className="fixed left-0 right-0 bottom-[60px] h-24 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-30" />

      {/* Fixed bottom CTA */}
      <div className="fixed left-0 right-0 bottom-20 z-40 px-6 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={handleContinuar}
            className="w-full rounded-full h-12 text-sm font-medium"
            style={{
              boxShadow: '0 -10px 40px -10px hsl(var(--background)), 0 4px 15px -3px hsl(var(--primary) / 0.2)',
            }}
          >
            {isLast
              ? <><Check size={15} className="mr-1.5" /> Concluir</>
              : 'Continuar'
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EquilibrioPage;
