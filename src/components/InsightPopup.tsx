import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateInsight, type InsightInput } from '@/lib/insights';

interface InsightPopupProps extends InsightInput {
  isOpen: boolean;
  onClose: () => void;
  bobColor: string;
}

const InsightPopup = ({
  isOpen,
  onClose,
  bobColor,
  statusLevel,
  position,
  emotions,
  note,
}: InsightPopupProps) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const { line1, line2 } = generateInsight({ statusLevel, position, emotions, note });

  const handleEquilibrar = () => {
    onClose();
    navigate('/equilibrio');
  };

  const handleEvolucao = () => {
    onClose();
    navigate('/biblioteca');
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-border/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Linha de acento no topo */}
        <div
          className="h-[3px] w-full"
          style={{
            background: `linear-gradient(to right, transparent, ${bobColor}80, transparent)`,
          }}
        />

        <div className="px-6 pt-5 pb-6">

          {/* Botão fechar */}
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute top-[18px] right-4 w-7 h-7 rounded-full bg-muted/70 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors"
          >
            <X size={13} />
          </button>

          {/* Ícone + Título */}
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${bobColor}22` }}
            >
              <Sparkles size={13} style={{ color: bobColor }} />
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.14em]">
              Um pensamento para você
            </span>
          </div>

          {/* Mensagem personalizada */}
          <div className="mb-6 space-y-2">
            <p className="text-[15px] leading-relaxed text-foreground font-medium">
              {line1}
            </p>
            <p className="text-[15px] leading-relaxed text-foreground/65">
              {line2}
            </p>
          </div>

          {/* Botões */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleEquilibrar}
              className="w-full rounded-full h-11 text-sm font-medium"
            >
              Equilibrar agora
            </Button>
            <button
              onClick={handleEvolucao}
              className="w-full h-11 rounded-full text-sm font-medium text-muted-foreground/60 hover:text-foreground/70 transition-colors"
            >
              Ver minha evolução
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InsightPopup;
