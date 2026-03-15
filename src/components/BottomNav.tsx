import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TrendingUp, Shirt, BookHeart } from 'lucide-react';

const PendulumIcon = ({ size = 22, strokeWidth = 1.6 }: { size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5 L8.5 17" />
    <circle cx="8.5" cy="19" r="2" />
    <path d="M8 5h8" />
  </svg>
);

const tabs = [
  { path: '/', icon: PendulumIcon, label: 'Pêndulo' },
  { path: '/biblioteca', icon: BookHeart, label: 'Biblioteca' },
  { path: '/padroes', icon: TrendingUp, label: 'Evolução' },
  { path: '/cabide', icon: Shirt, label: 'Cabide' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [tapped, setTapped] = useState<string | null>(null);

  const handleTap = (path: string) => {
    // Vibração haptic suave (8ms — quase imperceptível, só textura)
    if (navigator.vibrate) navigator.vibrate(8);

    // Dispara animação de bounce
    setTapped(path);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4 items-center py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active  = location.pathname === path;
          const popping = tapped === path;

          return (
            <button
              key={path}
              onClick={() => handleTap(path)}
              className={`flex w-full flex-col items-center gap-0.5 py-1.5 transition-colors duration-150 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {/* Ícone com pill de fundo + bounce */}
              <span className="relative flex h-8 w-8 items-center justify-center">

                {/* Pill de fundo — escala e faz fill suave ao ativar (estilo iFood) */}
                <span
                  className="absolute inset-0 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: 'hsl(var(--primary) / 0.12)',
                    transform: active ? 'scale(1)' : 'scale(0.4)',
                    opacity:   active ? 1 : 0,
                  }}
                />

                {/* Ícone com bounce ao toque (estilo Duolingo) */}
                <span
                  className={popping ? 'tab-pop' : ''}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onAnimationEnd={() => setTapped(null)}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.2 : 1.6}
                  />
                </span>
              </span>

              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
