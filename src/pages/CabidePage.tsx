import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import PendulumSlider from '@/components/PendulumSlider';
import NaoSeiFlow from '@/components/NaoSeiFlow';
import { saveEntry, getEntries, getTodayKey, getCurrentPeriod, PERIOD_CONFIG, DayPeriod } from '@/lib/pendulum';
import { Button } from '@/components/ui/button';
import { Sunrise, Sun, Moon } from 'lucide-react';

const PERIOD_ICONS: Record<DayPeriod, React.ReactNode> = {
  morning: <Sunrise size={16} />,
  afternoon: <Sun size={16} />,
  night: <Moon size={16} />,
};

// ─── Pêndulo v1 ────────────────────────────────────────────────────────────────
const PenduloV1 = ({ onBack }: { onBack: () => void }) => {
  const todayKey = getTodayKey();
  const [position, setPosition] = useState(50);
  const [showNaoSei, setShowNaoSei] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [period, setPeriod] = useState<DayPeriod>(getCurrentPeriod());

  useEffect(() => {
    const entries = getEntries();
    const todayPeriod = entries.find((e) => e.date === todayKey && e.period === period);
    if (todayPeriod) {
      setPosition(todayPeriod.position);
      setSaved(true);
    } else {
      setPosition(50);
      setSaved(false);
    }
    setHasMoved(false);
  }, [todayKey, period]);

  const handleSave = () => {
    saveEntry({ date: todayKey, position, period });
    setSaved(true);
    setHasMoved(false);
  };

  const handleNaoSeiResult = (pos: number) => {
    setPosition(pos);
    setHasMoved(true);
    setShowNaoSei(false);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Back button */}
      <div className="px-6 pt-10 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Armário
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-[2rem] font-semibold text-foreground mb-1 tracking-tight text-center">
          Onde está seu pêndulo mental agora?
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Toque em 'Descobrir' ou arraste o pêndulo para registrar
        </p>

        <PendulumSlider
          value={position}
          onChange={(v) => { setPosition(v); setSaved(false); setHasMoved(true); }}
        />

        <div className="mt-10">
          {saved ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-primary text-xs font-medium bg-primary/10 rounded-full px-4 py-2">
                {PERIOD_ICONS[period]}
                <span>{PERIOD_CONFIG[period].label} registrada</span>
              </div>
              <span className="text-[11px] text-muted-foreground/50">
                Mova o pêndulo para atualizar
              </span>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowNaoSei(true)}
                className="w-36 rounded-full h-11 text-sm font-medium"
              >
                Descobrir
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasMoved}
                className={`w-36 rounded-full h-11 text-sm font-medium transition-opacity ${
                  !hasMoved ? 'opacity-35' : ''
                }`}
              >
                Registrar
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 bg-muted rounded-full p-1 mt-6">
          {(['morning', 'afternoon', 'night'] as DayPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {PERIOD_ICONS[p]}
              {PERIOD_CONFIG[p].label}
            </button>
          ))}
        </div>
      </div>

      {showNaoSei && (
        <NaoSeiFlow
          onResult={handleNaoSeiResult}
          onCancel={() => setShowNaoSei(false)}
        />
      )}
    </div>
  );
};

// ─── Armário de Testes ──────────────────────────────────────────────────────────
type Cabide = {
  label: string;
  description: string;
  action: 'inline' | 'navigate';
  path?: string;
};

const cabides: Cabide[] = [
  {
    label: 'Pêndulo v1',
    description: 'Interface original do pêndulo',
    action: 'inline',
  },
  {
    label: 'Equilibre-se',
    description: 'Sessão de equilíbrio emocional',
    action: 'navigate',
    path: '/equilibrio',
  },
];

const CabidePage = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  if (active === 'Pêndulo v1') {
    return <PenduloV1 onBack={() => setActive(null)} />;
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-14 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
          Armário de testes
        </p>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Cabides
        </h1>
      </div>

      {/* List */}
      <div className="px-4">
        {cabides.map((c, i) => (
          <button
            key={c.label}
            onClick={() => {
              if (c.action === 'inline') setActive(c.label);
              else if (c.path) navigate(c.path);
            }}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl hover:bg-muted/60 active:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="text-base">🧥</span>
              <div>
                <p className="text-sm font-medium text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{c.description}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default CabidePage;
