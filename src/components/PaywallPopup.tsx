import { Lock } from 'lucide-react';

interface PaywallPopupProps {
  onClose: () => void;
  onManageToday: () => void;
}

// Bob triste — valor ~18 (Autopiedade), cor laranja-avermelhada
const SadBob = () => (
  <div
    className="relative w-16 h-16 rounded-full flex items-center justify-center"
    style={{
      backgroundColor: 'hsl(8, 74%, 54%)',
      boxShadow: '0 4px 16px hsl(8, 74%, 54%, 0.35)',
    }}
  >
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {/* Olhos normais levemente caídos */}
      <ellipse cx="13" cy="15" rx="2.5" ry="2.8" fill="white" opacity="0.82" />
      <ellipse cx="27" cy="15" rx="2.5" ry="2.8" fill="white" opacity="0.82" />
      {/* Boca triste — ctrlY (10) < endY (25) → arco pra cima = ⌢ = FROWN */}
      <path
        d="M 10,25 Q 20,14 30,25"
        stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.82"
      />
    </svg>
  </div>
);

const PaywallPopup = ({ onClose, onManageToday }: PaywallPopupProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/25 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Card */}
    <div className="relative w-full max-w-xs bg-background rounded-3xl p-6 popup-slide-in shadow-2xl">

      {/* Bob triste */}
      <div className="flex justify-center mb-4">
        <SadBob />
      </div>

      <h3 className="text-[17px] font-semibold text-foreground text-center mb-2">
        Limite diário atingido
      </h3>
      <p className="text-[13px] text-muted-foreground text-center leading-relaxed mb-6">
        Seu plano gratuito permite manter até{' '}
        <span className="font-semibold text-foreground">3 registros por dia</span>.
        Você pode apagar um anterior pra abrir espaço, ou fazer upgrade pra registrar sem limites.
      </p>

      <div className="flex gap-3 mb-3">
        <button
          onClick={onClose}
          className="flex-1 h-11 rounded-2xl border border-border text-sm font-medium text-foreground active:bg-muted transition-colors"
        >
          Agora não
        </button>
        <button
          onClick={onClose}
          className="flex-1 h-11 rounded-2xl bg-primary text-white text-sm font-semibold active:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
        >
          <Lock size={13} strokeWidth={2.2} />
          Ver planos
        </button>
      </div>

      <button
        onClick={onManageToday}
        className="w-full h-8 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
      >
        Ou apague um registro de hoje da Biblioteca
      </button>

    </div>
  </div>
);

export default PaywallPopup;
