import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  CONTEXTUAL_EMOTIONS,
  ORDERED_UNIVERSAL_EMOTIONS,
  type StatusLevel,
} from '@/lib/pendulum';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EmotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (emotions: string[]) => void;
  statusLevel: StatusLevel;
  bobColor: string;
}

const EmotionModal = ({
  isOpen,
  onClose,
  onConfirm,
  statusLevel,
  bobColor,
}: EmotionModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);

  const contextual = CONTEXTUAL_EMOTIONS[statusLevel];

  // Ordered list for the active status, minus any that already appear contextually
  const universalFiltered = useMemo(
    () => ORDERED_UNIVERSAL_EMOTIONS[statusLevel].filter(e => !contextual.includes(e)),
    [contextual, statusLevel],
  );

  const isMaxed = selected.length >= 3;

  const toggle = (emotion: string) => {
    setSelected(prev => {
      if (prev.includes(emotion)) return prev.filter(e => e !== emotion);
      if (prev.length >= 3) return prev;
      return [...prev, emotion];
    });
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onConfirm(selected);
    setSelected([]);
    setShowMore(false);
  };

  const handleClose = () => {
    setSelected([]);
    setShowMore(false);
    onClose();
  };

  if (!isOpen) return null;

  // ─── Chip ──────────────────────────────────────────────────────────────────
  const Chip = ({ emotion }: { emotion: string }) => {
    const active   = selected.includes(emotion);
    const disabled = isMaxed && !active;

    return (
      <button
        onClick={() => { if (!disabled) toggle(emotion); }}
        className={[
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 select-none',
          active
            ? 'text-white shadow-sm'
            : disabled
              ? 'bg-muted/40 text-muted-foreground/30'
              : 'bg-muted text-foreground/75 active:scale-[0.96]',
        ].join(' ')}
        style={
          active
            ? { backgroundColor: bobColor, boxShadow: `0 2px 10px ${bobColor}45` }
            : undefined
        }
      >
        {emotion}
      </button>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[200] flex items-end">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div className="relative w-full bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[88dvh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 shrink-0">
          <div className="w-10 h-[3px] rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="px-6 pt-4 pb-3 shrink-0">
          <h2 className="text-lg font-semibold text-foreground leading-snug">
            Quais emoções mais descrevem você agora?
          </h2>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-muted-foreground">
              Escolha até 3 opções
            </p>
            {selected.length > 0 && (
              <span
                className="text-xs font-semibold tabular-nums transition-colors"
                style={{ color: bobColor }}
              >
                {selected.length}/3
              </span>
            )}
          </div>
        </div>

        {/* Scrollable emotion area */}
        <div className="flex-1 overflow-y-auto px-6 pb-1">

          {/* Contextual emotions */}
          <div className="flex flex-wrap gap-2 pt-1 pb-5">
            {contextual.map(e => <Chip key={e} emotion={e} />)}
          </div>

          {/* Expandable: universal emotions */}
          <button
            onClick={() => setShowMore(v => !v)}
            className="flex items-center gap-1.5 text-[13px] text-muted-foreground/50
              hover:text-muted-foreground/70 transition-colors mb-3"
          >
            {showMore
              ? <><ChevronUp size={13} /> Ver menos</>
              : <><ChevronDown size={13} /> + Ver mais emoções</>
            }
          </button>

          {showMore && (
            <div className="pb-5">
              <p className="text-sm font-medium text-foreground/70 mb-1">
                Emoções complementares
              </p>
              <p className="text-[12px] text-muted-foreground/50 mb-3 leading-relaxed">
                Algumas emoções podem aparecer independentemente de como você está se sentindo.
              </p>
              <div className="flex flex-wrap gap-2">
                {universalFiltered.map(e => <Chip key={e} emotion={e} />)}
              </div>
            </div>
          )}

          {/* Bottom spacer when collapsed */}
          {!showMore && <div className="pb-3" />}
        </div>

        {/* Sticky footer */}
        <div
          className="px-6 pt-3 border-t border-border/40 shrink-0"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0}
            className="w-full rounded-full h-12 text-sm font-medium"
          >
            Concluir registro
          </Button>
        </div>

      </div>
    </div>
  );
};

export default EmotionModal;
