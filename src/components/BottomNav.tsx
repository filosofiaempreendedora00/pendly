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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4 items-center py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex w-full flex-col items-center gap-0.5 py-1.5 transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center">
                <Icon size={20} strokeWidth={1.8} />
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
