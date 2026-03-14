import { useState, useEffect } from 'react';
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
// Snapshot da tela original do pêndulo, preservada para referência futura.
const PenduloV1 = () => {
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24">
        {/* Header */}
        <h1 className="text-[2rem] font-semibold text-foreground mb-1 tracking-tight text-center">
          Onde está seu pêndulo mental agora?
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Toque em 'Descobrir' ou arraste o pêndulo para registrar
        </p>

        {/* Pendulum */}
        <PendulumSlider
          value={position}
          onChange={(v) => { setPosition(v); setSaved(false); setHasMoved(true); }}
        />

        {/* Buttons / saved state */}
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

        {/* Period selector */}
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

// ─── CabidePage ────────────────────────────────────────────────────────────────
// Telas arquivadas para referência / reuso futuro.
const screens = [
  { label: 'Pêndulo v1', component: <PenduloV1 /> },
];

const CabidePage = () => {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-10 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">
          Cabide
        </h2>
        <div className="flex gap-2 flex-wrap">
          {screens.map((s, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                active === i
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 my-2 border-t border-dashed border-border/60" />

      {/* Archived screen */}
      {screens[active].component}
    </div>
  );
};

export default CabidePage;
