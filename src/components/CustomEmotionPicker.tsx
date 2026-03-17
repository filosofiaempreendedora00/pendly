import { useState } from 'react';
import { Plus, Sparkles, Pencil, Trash2, Check, X, Settings2 } from 'lucide-react';
import { getCustomEmotions, saveCustomEmotion, deleteCustomEmotion, renameCustomEmotion } from '@/lib/pendulum';

export const CUSTOM_COLOR    = '#9b30f5';
export const CUSTOM_GRADIENT = 'linear-gradient(90deg, #9b30f5, #5b8ef0, #00d4a0)';
export const CUSTOM_GRADIENT_TEXT = {
  background: CUSTOM_GRADIENT,
  WebkitBackgroundClip: 'text' as const,
  WebkitTextFillColor: 'transparent' as const,
  backgroundClip: 'text' as const,
};

// ─── ManageEmotionsSheet ──────────────────────────────────────────────────────
const ManageEmotionsSheet = ({
  onClose,
  onChanged,
  onReplaceSelection,
}: {
  onClose: () => void;
  onChanged: () => void;
  onReplaceSelection?: (oldE: string, newE: string) => void;
}) => {
  const [emotions, setEmotions]             = useState(() => getCustomEmotions());
  const [editingEmotion, setEditingEmotion] = useState<string | null>(null);
  const [editValue, setEditValue]           = useState('');
  const [confirmDelete, setConfirmDelete]   = useState<string | null>(null);
  const [newInput, setNewInput]             = useState('');
  const [showNewInput, setShowNewInput]     = useState(false);

  const refresh = () => { setEmotions(getCustomEmotions()); onChanged(); };

  const handleAdd = () => {
    const val = newInput.trim().toLowerCase();
    if (!val || emotions.includes(val)) return;
    saveCustomEmotion(val);
    refresh();
    setNewInput('');
    setShowNewInput(false);
  };

  const startEdit = (emotion: string) => {
    setConfirmDelete(null);
    setEditingEmotion(emotion);
    setEditValue(emotion);
  };

  const handleSaveEdit = () => {
    if (!editingEmotion) return;
    const val = editValue.trim().toLowerCase();
    if (val && val !== editingEmotion && !emotions.includes(val)) {
      renameCustomEmotion(editingEmotion, val);
      onReplaceSelection?.(editingEmotion, val);
      refresh();
    }
    setEditingEmotion(null);
  };

  const handleDelete = (emotion: string) => {
    deleteCustomEmotion(emotion);
    refresh();
    setConfirmDelete(null);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[82dvh]">

        <div className="flex justify-center pt-3 shrink-0">
          <div className="w-10 h-[3px] rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-6 pt-4 pb-3 shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-[17px] font-semibold leading-snug">
              <span style={CUSTOM_GRADIENT_TEXT}>Emoções personalizadas</span>
            </h2>
            <p className="text-[13px] text-muted-foreground/55 mt-0.5">
              Edite ou exclua suas emoções criadas
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors mt-0.5"
          >
            <X size={13} />
          </button>
        </div>

        <div className="mx-6 border-t border-border/30 shrink-0" />

        <div
          className="flex-1 overflow-y-auto px-6 pt-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {emotions.length === 0 && !showNewInput && (
            <p className="text-[13px] text-muted-foreground/35 text-center py-6 italic">
              Nenhuma emoção personalizada ainda.
            </p>
          )}

          {emotions.length > 0 && (
            <div className="flex flex-col mb-4">
              {emotions.map(emotion => (
                <div key={emotion}>
                  {editingEmotion === emotion ? (
                    <div className="flex items-center gap-2 py-2">
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingEmotion(null);
                        }}
                        className="flex-1 h-11 rounded-xl border px-3 text-[14px] bg-transparent text-foreground focus:outline-none"
                        style={{ borderColor: `${CUSTOM_COLOR}60` }}
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: CUSTOM_GRADIENT }}
                      >
                        <Check size={15} className="text-white" />
                      </button>
                      <button
                        onClick={() => setEditingEmotion(null)}
                        className="w-11 h-11 rounded-xl border border-border/60 flex items-center justify-center shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-1.5">
                      <span
                        className="flex-1 px-3.5 py-2.5 rounded-xl text-[14px] font-medium"
                        style={{ backgroundColor: 'rgba(155,48,245,0.07)' }}
                      >
                        <span style={CUSTOM_GRADIENT_TEXT}>{emotion}</span>
                      </span>
                      <button
                        onClick={() => startEdit(emotion)}
                        className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground/45 hover:text-muted-foreground active:bg-muted transition-colors shrink-0"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingEmotion(null);
                          setConfirmDelete(emotion === confirmDelete ? null : emotion);
                        }}
                        className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground/35 hover:text-red-400 active:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}

                  {confirmDelete === emotion && (
                    <div className="rounded-2xl border border-red-100 bg-red-50/70 px-3.5 py-3 flex flex-col gap-2.5 mb-2">
                      <div>
                        <p className="text-[12px] font-medium text-foreground/80 mb-0.5">
                          Excluir <strong>"{emotion}"</strong> para sempre?
                        </p>
                        <p className="text-[11px] text-muted-foreground/55 leading-relaxed">
                          Essa ação não pode ser desfeita. Que tal editar o nome em vez disso?
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { startEdit(emotion); setConfirmDelete(null); }}
                          className="flex-1 h-9 rounded-xl text-[12px] font-semibold"
                          style={{ backgroundColor: 'rgba(155,48,245,0.10)' }}
                        >
                          <span style={CUSTOM_GRADIENT_TEXT}>Editar nome</span>
                        </button>
                        <button
                          onClick={() => handleDelete(emotion)}
                          className="flex-1 h-9 rounded-xl bg-red-500 text-[12px] font-semibold text-white active:bg-red-600 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {showNewInput ? (
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex-1 flex items-center gap-2 h-11 rounded-xl border px-3"
                style={{ borderColor: `${CUSTOM_COLOR}50`, backgroundColor: 'rgba(155,48,245,0.05)' }}
              >
                <Sparkles size={13} style={{ color: CUSTOM_COLOR, flexShrink: 0 }} />
                <input
                  autoFocus
                  value={newInput}
                  onChange={e => setNewInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAdd();
                    if (e.key === 'Escape') { setShowNewInput(false); setNewInput(''); }
                  }}
                  placeholder="Nome da emoção..."
                  className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
                <button
                  onClick={() => { setShowNewInput(false); setNewInput(''); }}
                  className="text-muted-foreground/30 hover:text-muted-foreground/60 shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={!newInput.trim()}
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
                style={{ background: CUSTOM_GRADIENT }}
              >
                <Plus size={16} className="text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewInput(true)}
              className="flex items-center gap-2 text-[13px] font-medium"
            >
              <Sparkles size={13} style={{ color: CUSTOM_COLOR }} />
              <span style={CUSTOM_GRADIENT_TEXT}>Adicionar emoção</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── CustomEmotionPicker ──────────────────────────────────────────────────────
interface Props {
  selected: string[];
  onToggle: (emotion: string) => void;
  onReplaceSelection?: (oldEmotion: string, newEmotion: string) => void;
  isMaxed: boolean;
  size?: 'sm' | 'md';
}

export function CustomEmotionPicker({ selected, onToggle, onReplaceSelection, isMaxed, size = 'md' }: Props) {
  const [emotions, setEmotions]         = useState<string[]>(() => getCustomEmotions());
  const [showManage, setShowManage]     = useState(false);
  const [newInput, setNewInput]         = useState('');
  const [showNewInput, setShowNewInput] = useState(false);

  const chipCls = size === 'sm'
    ? 'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 select-none'
    : 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 select-none';

  const refresh = () => setEmotions(getCustomEmotions());

  const handleAdd = () => {
    const val = newInput.trim().toLowerCase();
    if (!val || emotions.includes(val)) return;
    saveCustomEmotion(val);
    refresh();
    if (!isMaxed) onToggle(val);
    setNewInput('');
    setShowNewInput(false);
  };

  if (emotions.length === 0 && !showNewInput) {
    if (isMaxed) return null;
    return (
      <button
        onClick={() => setShowNewInput(true)}
        className="flex items-center gap-1.5 text-[13px] font-medium"
      >
        <Sparkles size={12} style={{ color: CUSTOM_COLOR }} />
        <span style={CUSTOM_GRADIENT_TEXT}>Criar emoção personalizada</span>
      </button>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">

        {emotions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              <span style={CUSTOM_GRADIENT_TEXT}>✦ Personalizadas</span>
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-2">
              {emotions.map(emotion => {
                const active   = selected.includes(emotion);
                const disabled = isMaxed && !active;
                return (
                  <button
                    key={emotion}
                    onClick={() => { if (!disabled) onToggle(emotion); }}
                    className={[chipCls, active ? 'text-white' : disabled ? 'opacity-30' : 'active:scale-[0.96]'].join(' ')}
                    style={active
                      ? { background: CUSTOM_GRADIENT, boxShadow: `0 2px 14px rgba(155,48,245,0.35)` }
                      : { backgroundColor: 'rgba(155,48,245,0.07)', boxShadow: '0 0 0 1px rgba(155,48,245,0.22)' }
                    }
                  >
                    {active
                      ? emotion
                      : <span style={CUSTOM_GRADIENT_TEXT}>{emotion}</span>
                    }
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          {!isMaxed && (
            showNewInput ? (
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="flex-1 flex items-center gap-2 h-9 rounded-full border px-3"
                  style={{ borderColor: `${CUSTOM_COLOR}50`, backgroundColor: 'rgba(155,48,245,0.05)' }}
                >
                  <Sparkles size={11} style={{ color: CUSTOM_COLOR, flexShrink: 0 }} />
                  <input
                    autoFocus
                    value={newInput}
                    onChange={e => setNewInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAdd();
                      if (e.key === 'Escape') { setShowNewInput(false); setNewInput(''); }
                    }}
                    placeholder="Nome da emoção..."
                    className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                  />
                  <button
                    onClick={() => { setShowNewInput(false); setNewInput(''); }}
                    className="text-muted-foreground/30 hover:text-muted-foreground/60 shrink-0"
                  >
                    <X size={11} />
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!newInput.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
                  style={{ background: CUSTOM_GRADIENT }}
                >
                  <Plus size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewInput(true)}
                className="flex items-center gap-1.5 text-[12px] font-medium"
              >
                <Sparkles size={11} style={{ color: CUSTOM_COLOR }} />
                <span style={CUSTOM_GRADIENT_TEXT}>
                  {emotions.length > 0 ? 'Criar outra' : 'Criar emoção personalizada'}
                </span>
              </button>
            )
          )}

          {emotions.length > 0 && !showNewInput && (
            <>
              {!isMaxed && <span className="text-muted-foreground/20 text-[11px] select-none">·</span>}
              <button
                onClick={() => setShowManage(true)}
                className="flex items-center gap-1 text-[12px] font-medium"
              >
                <Settings2 size={11} style={{ color: CUSTOM_COLOR }} />
                <span style={CUSTOM_GRADIENT_TEXT}>Gerenciar</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showManage && (
        <ManageEmotionsSheet
          onClose={() => { setShowManage(false); refresh(); }}
          onChanged={refresh}
          onReplaceSelection={onReplaceSelection}
        />
      )}
    </>
  );
}
