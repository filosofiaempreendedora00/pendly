import { Lock } from 'lucide-react';

interface PaywallPopupProps {
  onClose: () => void;
  onManageToday: () => void;
}

const PaywallPopup = ({ onClose, onManageToday }: PaywallPopupProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/25 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Card — sem overflow-hidden p/ o emoji poder ultrapassar a borda superior */}
    <div className="relative w-full max-w-xs bg-background rounded-3xl px-6 pt-14 pb-6 popup-slide-in shadow-2xl">

      {/* 😬 flutuando acima do card — efeito 3D */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-8 select-none pointer-events-none"
        style={{ fontSize: 72, lineHeight: 1 }}
      >
        😬
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
