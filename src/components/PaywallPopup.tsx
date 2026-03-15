import { Lock } from 'lucide-react';

interface PaywallPopupProps {
  onClose: () => void;
  onManageToday: () => void;
}

// GrimaceBob — inspirado em 😬 "ops..."
// Cor âmbar neutra (distinta dos tons de humor), sobrancelhas arqueadas de
// tensão, olhos levemente apertados e boca larga mostrando dentes (linha de
// gengiva + 4 divisores = 5 dentes visíveis).
const GrimaceBob = () => {
  const face = 'hsl(38, 68%, 54%)'; // âmbar quente — nem vermelho-doom nem verde-feliz
  return (
    <div
      className="relative w-16 h-16 rounded-full"
      style={{ backgroundColor: face, boxShadow: `0 4px 18px hsl(38 68% 54% / 0.40)` }}
    >
      <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>

        {/* Sobrancelhas: arqueadas pra cima — expressão de tensão / "ops" */}
        <path d="M 8.5,11 Q 13,8.5 17,10.5"  stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.72" />
        <path d="M 23,10.5 Q 27,8.5 31.5,11" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.72" />

        {/* Olhos: ligeiramente achatados (tensão, não felicidade) */}
        <ellipse cx="13" cy="16" rx="2.8" ry="2.1" fill="white" opacity="0.88" />
        <ellipse cx="27" cy="16" rx="2.8" ry="2.1" fill="white" opacity="0.88" />

        {/* ── Boca grimace ─────────────────────────────────────────────────── */}
        {/* Área de dentes: preenchimento branco entre lábio sup e inf */}
        <path
          d="M 7,25.5 C 13,22.5 27,22.5 33,25.5 C 27,31.5 13,31.5 7,25.5 Z"
          fill="white" opacity="0.92"
        />
        {/* Linha da gengiva: divide dentes superiores e inferiores */}
        <path
          d="M 7,25.5 C 13,26.2 27,26.2 33,25.5"
          stroke={face} strokeWidth="1.0" fill="none" opacity="0.65"
        />
        {/* Lábio superior — borda sutil */}
        <path
          d="M 7,25.5 C 13,22.5 27,22.5 33,25.5"
          stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.50"
        />
        {/* Lábio inferior — borda sutil */}
        <path
          d="M 7,25.5 C 13,31.5 27,31.5 33,25.5"
          stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity="0.50"
        />
        {/* Divisores dos dentes (4 linhas = 5 dentes) */}
        <line x1="13.0" y1="23.2" x2="11.8" y2="30.5" stroke={face} strokeWidth="0.9" opacity="0.55" />
        <line x1="18.0" y1="22.6" x2="16.8" y2="31.2" stroke={face} strokeWidth="0.9" opacity="0.55" />
        <line x1="22.5" y1="22.5" x2="21.5" y2="31.5" stroke={face} strokeWidth="0.9" opacity="0.55" />
        <line x1="27.5" y1="22.6" x2="26.5" y2="30.8" stroke={face} strokeWidth="0.9" opacity="0.55" />

      </svg>
    </div>
  );
};

const PaywallPopup = ({ onClose, onManageToday }: PaywallPopupProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/25 backdrop-blur-sm"
      onClick={onClose}
    />

    {/* Card */}
    <div className="relative w-full max-w-xs bg-background rounded-3xl p-6 popup-slide-in shadow-2xl">

      {/* Bob "ops..." — grimace 😬 */}
      <div className="flex justify-center mb-4">
        <GrimaceBob />
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
