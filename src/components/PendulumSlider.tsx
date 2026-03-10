import { useCallback, useRef, useState, useEffect } from 'react';
import { getZoneLabel, getZone, getBobColor } from '@/lib/pendulum';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { X, Info } from 'lucide-react';

const STATUS_INFO: Record<string, { title: string; subtitle: string; description: string }> = {
  autopiedade: {
    title: 'Autopiedade',
    subtitle: 'Quando você sente que a vida está acontecendo contra você.',
    description: 'Aqui a tendência é olhar para as situações apenas pelo lado da injustiça ou do sofrimento. A dor existe — mas o foco fica mais em "por que isso está acontecendo comigo?" do que em "o que posso fazer a partir daqui?".',
  },
  autocompaixao: {
    title: 'Autocompaixão',
    subtitle: 'Quando você reconhece sua dor sem se atacar por isso.',
    description: 'É a capacidade de se tratar com humanidade quando algo dá errado. Você aceita que está difícil, valida o que sente e se permite respirar antes de agir.',
  },
  equilibrio: {
    title: 'Equilíbrio',
    subtitle: 'Quando você consegue ver a situação com clareza.',
    description: 'Aqui existe um equilíbrio entre reconhecer emoções e assumir responsabilidade pelas próprias ações. Nem se culpar demais, nem se colocar como vítima — apenas olhar a realidade como ela é.',
  },
  autorresponsabilidade: {
    title: 'Autorresponsabilidade',
    subtitle: 'Quando você assume seu papel na situação.',
    description: 'Nesse estado você olha para os fatos e pergunta: "o que depende de mim agora?". A energia deixa de ir para justificativas ou acusações e passa a ir para ação e aprendizado.',
  },
  autoflagelo: {
    title: 'Autoflagelo',
    subtitle: 'Quando você se ataca mais do que a situação merece.',
    description: 'Aqui a autocrítica vira punição. Pequenos erros parecem enormes, e surge a sensação de que você deveria ser melhor, mais forte ou diferente. A cobrança ultrapassa o limite saudável.',
  },
};

const InfoDot = ({ infoKey }: { infoKey: string }) => {
  const [open, setOpen] = useState(false);
  const info = STATUS_INFO[infoKey];
  if (!info) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted-foreground/30 text-background text-[9px] font-bold leading-none hover:bg-muted-foreground/50 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          i
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-4 rounded-xl shadow-lg border border-border/50 bg-popover"
        sideOffset={8}
        onPointerDownOutside={() => setOpen(false)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-sm font-semibold text-foreground">{info.title}</h4>
          <button
            onClick={() => setOpen(false)}
            className="text-muted-foreground/50 hover:text-muted-foreground transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-xs font-medium text-foreground/80 mb-1.5">{info.subtitle}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{info.description}</p>
      </PopoverContent>
    </Popover>
  );
};

interface PendulumSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const PendulumSlider = ({ value, onChange }: PendulumSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const pendulumRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragSource, setDragSource] = useState<'track' | 'bob' | null>(null);

  const updateValueFromTrack = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = (x / rect.width) * 100;
      onChange(Math.round(pct));
    },
    [onChange]
  );

  const updateValueFromBob = useCallback(
    (clientX: number) => {
      // Use the track as reference for horizontal mapping
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const pct = (x / rect.width) * 100;
      onChange(Math.round(pct));
    },
    [onChange]
  );

  // Track handlers
  const handleTrackPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragSource('track');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValueFromTrack(e.clientX);
  };

  const handleTrackPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || dragSource !== 'track') return;
    updateValueFromTrack(e.clientX);
  };

  // Bob handlers
  const handleBobPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragSource('bob');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleBobPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || dragSource !== 'bob') return;
    updateValueFromBob(e.clientX);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragSource(null);
  };

  const zone = getZone(value);
  const label = getZoneLabel(value);

  // Pendulum string angle calculation
  const angle = ((value - 50) / 50) * -35; // Inverted: left value = left swing

  return (
    <div className="w-full max-w-[28rem] mx-auto flex flex-col items-center gap-4 px-4">
      {/* Pendulum visual */}
      <div className="relative h-52 w-full flex items-start justify-center overflow-hidden">
      {/* Pivot point - sits on top of string */}
        <div className="absolute top-0 w-4 h-4 rounded-full bg-muted-foreground/30 z-10" />
        
        {/* String + bob */}
        <div
          className="absolute top-4 origin-top transition-transform"
          style={{
            transform: `rotate(${angle}deg)`,
            transitionDuration: isDragging ? '0ms' : '400ms',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {/* String ends at the top of the bob */}
          <div className="w-px h-32 bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20 mx-auto" />
          {/* Bob with gradient based on position */}
          <div className="relative w-10 h-10 mx-auto">
            {/* Invisible expanded touch target */}
            <div
              className="absolute -inset-4 rounded-full cursor-grab active:cursor-grabbing touch-none select-none z-10"
              onPointerDown={handleBobPointerDown}
              onPointerMove={handleBobPointerMove}
              onPointerUp={handlePointerUp}
            />
            <div
              className="w-10 h-10 rounded-full shadow-lg transition-all duration-300 pointer-events-none"
            style={{
              backgroundColor: getBobColor(value),
              boxShadow: `0 4px 15px ${getBobColor(value)}66`,
            }}
            />
          </div>
        </div>
      </div>

      {/* Current label */}
      <div className={`font-medium text-muted-foreground text-center min-h-[2.5rem] flex items-center justify-center gap-1.5 ${
        label.startsWith('Entre') ? 'text-sm' : 'text-lg'
      }`}>
        <span>{label}</span>
        {!label.startsWith('Entre') && <InfoDot infoKey={
          label === 'Autopiedade' ? 'autopiedade' :
          label === 'Autocompaixão' ? 'autocompaixao' :
          label === 'Equilíbrio' ? 'equilibrio' :
          label === 'Autorresponsabilidade' ? 'autorresponsabilidade' :
          label === 'Autoflagelo' ? 'autoflagelo' : ''
        } />}
      </div>

      {/* Spectrum track */}
      <div className="w-full">
        {/* Labels above track */}
        <div className="grid grid-cols-5 items-end mb-3 text-[9px] sm:text-[11px] leading-none">
          <span />
          <span className="text-primary/70 font-medium text-center">Autocompaixão</span>
          <span />
          <span className="text-primary/70 font-medium text-center">Autorresp.</span>
          <span />
        </div>

        <div
          ref={trackRef}
          onPointerDown={handleTrackPointerDown}
          onPointerMove={handleTrackPointerMove}
          onPointerUp={handlePointerUp}
          className="relative h-2 rounded-full cursor-pointer touch-none select-none"
          style={{
            background: `linear-gradient(to right, 
              hsl(var(--pendly-danger)) 0%, 
              hsl(var(--pendly-safe)) 25%, 
              hsl(var(--pendly-neutral)) 50%, 
              hsl(var(--pendly-safe)) 75%, 
              hsl(var(--pendly-danger)) 100%)`,
          }}
        >
          {/* Thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 border-background bg-foreground shadow-md transition-shadow ${
              isDragging ? 'shadow-lg scale-110' : ''
            }`}
            style={{ left: `${value}%`, transition: isDragging ? 'none' : 'left 400ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
          />
        </div>

        {/* Labels below track */}
        <div className="grid grid-cols-5 items-start mt-3 text-[9px] sm:text-[11px] leading-none">
          <span className="text-destructive/70 font-medium text-left">Autopiedade</span>
          <span />
          <span className="text-muted-foreground font-medium text-center">Equilíbrio</span>
          <span />
          <span className="text-destructive/70 font-medium text-right">Autoflagelo</span>
        </div>
      </div>
    </div>
  );
};

export default PendulumSlider;
