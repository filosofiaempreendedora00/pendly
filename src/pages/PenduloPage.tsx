import { useState, useEffect } from 'react';
import PendulumSlider from '@/components/PendulumSlider';
import NaoSeiFlow from '@/components/NaoSeiFlow';
import { saveEntry, getEntries, getTodayKey, getCurrentPeriod, PERIOD_CONFIG, DayPeriod } from '@/lib/pendulum';
import { Button } from '@/components/ui/button';
import { Check, Sunrise, Sun, Moon } from 'lucide-react';

const PERIOD_ICONS: Record<DayPeriod, React.ReactNode> = {
  morning: <Sunrise size={16} />,
  afternoon: <Sun size={16} />,
  night: <Moon size={16} />,
};

const PenduloPage = () => {
  const todayKey = getTodayKey();
  const [position, setPosition] = useState(50);
  const [showNaoSei, setShowNaoSei] = useState(false);
  const [saved, setSaved] = useState(false);
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
  }, [todayKey, period]);

  const handleSave = () => {
    saveEntry({ date: todayKey, position, period });
    setSaved(true);
  };

  const handleNaoSeiResult = (pos: number) => {
    setPosition(pos);
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
          Arraste para posicionar
        </p>

        {/* Pendulum */}
        <PendulumSlider value={position} onChange={(v) => { setPosition(v); setSaved(false); }} />

        {/* Save button */}
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
            <Button
              onClick={handleSave}
              className="rounded-full px-8 h-11 text-sm font-medium"
            >
              Registrar
            </Button>
          )}
        </div>

        {!saved && (
          <Button
            variant="ghost"
            onClick={() => setShowNaoSei(true)}
            className="mt-4 rounded-full px-6 h-9 text-xs text-muted-foreground/60 hover:text-muted-foreground"
          >
            Não sei dizer...
          </Button>
        )}

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

export default PenduloPage;
