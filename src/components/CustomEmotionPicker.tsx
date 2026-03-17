import { useState } from 'react';
import { Plus, Sparkles, Pencil, Trash2, Check, X } from 'lucide-react';
import { getCustomEmotions, saveCustomEmotion, deleteCustomEmotion, renameCustomEmotion } from '@/lib/pendulum';

export const CUSTOM_COLOR = '#a020f0';

interface Props {
  selected: string[];
  onToggle: (emotion: string) => void;
  onReplaceSelection?: (oldEmotion: string, newEmotion: string) => void;
  isMaxed: boolean;
  size?: 'sm' | 'md';
}

export function CustomEmotionPicker({ selected, onToggle, onReplaceSelection, isMaxed, size = 'md' }: Props) {
  const [emotions, setEmotions] = useState<string[]>(() => getCustomEmotions());
  const [newInput, setNewInput]       = useState('');
  const [showNewInput, setShowNewInput] = useState(false);
  const [editingEmotion, setEditingEmotion] = useState<string | null>(null);
  const [editValue, setEditValue]     = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const chipCls = size === 'sm'
    ? 'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 select-none'
    : 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 select-none';

  const refresh = () => setEmotions(getCustomEmotions());

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = () => {
    const val = newInput.trim().toLowerCase();
    if (!val || emotions.includes(val)) return;
    saveCustomEmotion(val);
    refresh();
    if (!isMaxed) onToggle(val); // auto-select
    setNewInput('');
    setShowNewInput(false);
  };

  // ── Edit / Rename ─────────────────────────────────────────────────────────────
  const startEdit = (emotion: string) => {
    setConfirmDelete(null);
    setEditingEmotion(emotion);
    setEditValue(emotion);
  };

  const handleSaveEdit = () => {
    if (!editingEmotion) return;
    const val = editValue.trim().toLowerCase();
    if (!val || (emotions.includes(val) && val !== editingEmotion)) {
      setEditingEmotion(null);
      return;
    }
    if (val !== editingEmotion) {
      renameCustomEmotion(editingEmotion, val);
      refresh();
      if (selected.includes(editingEmotion)) onReplaceSelection?.(editingEmotion, val);
    }
    setEditingEmotion(null);
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (emotion: string) => {
    deleteCustomEmotion(emotion);
    refresh();
    if (selected.includes(emotion)) onToggle(emotion);
    setConfirmDelete(null);
  };

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (emotions.length === 0 && !showNewInput) {
    if (isMaxed) return null;
    return (
      <button
        onClick={() => setShowNewInput(true)}
        className="flex items-center gap-1.5 text-[13px] font-medium transition-colors"
        style={{ color: `${CUSTOM_COLOR}cc` }}
      >
        <Sparkles size={12} />
        Criar emoção personalizada
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">

      {/* Section header + chips */}
      {emotions.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: `${CUSTOM_COLOR}88` }}>
            ✦ Personalizadas
          </span>

          <div className="flex flex-wrap gap-x-2 gap-y-2">
            {emotions.map(emotion => {

              // ── Edit mode inline ────────────────────────────────────────────
              if (editingEmotion === emotion) {
                return (
                  <div key={emotion} className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') setEditingEmotion(null);
                      }}
                      className="h-8 rounded-full border px-3 text-[13px] bg-transparent text-foreground focus:outline-none"
                      style={{ borderColor: `${CUSTOM_COLOR}60`, minWidth: 80, width: `${Math.max(80, editValue.length * 9 + 36)}px` }}
                    />
                    <button onClick={handleSaveEdit}
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: CUSTOM_COLOR }}>
                      <Check size={11} className="text-white" />
                    </button>
                    <button onClick={() => setEditingEmotion(null)}
                      className="text-muted-foreground/40 hover:text-muted-foreground/70 shrink-0">
                      <X size={11} />
                    </button>
                  </div>
                );
              }

              // ── Normal chip ─────────────────────────────────────────────────
              const active   = selected.includes(emotion);
              const disabled = isMaxed && !active;
              return (
                <div key={emotion} className="flex items-center gap-0.5">
                  <button
                    onClick={() => { if (!disabled) onToggle(emotion); }}
                    className={[chipCls, active ? 'text-white' : disabled ? 'opacity-30' : 'active:scale-[0.96]'].join(' ')}
                    style={active
                      ? { backgroundColor: CUSTOM_COLOR, boxShadow: `0 2px 14px ${CUSTOM_COLOR}50` }
                      : { backgroundColor: `${CUSTOM_COLOR}14`, color: CUSTOM_COLOR, boxShadow: `0 0 0 1px ${CUSTOM_COLOR}35` }
                    }
                  >
                    {emotion}
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => startEdit(emotion)}
                    className="w-5 h-5 flex items-center justify-center text-muted-foreground/25 hover:text-muted-foreground/60 active:text-muted-foreground/80 transition-colors shrink-0"
                  >
                    <Pencil size={8} />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => { setEditingEmotion(null); setConfirmDelete(emotion === confirmDelete ? null : emotion); }}
                    className="w-5 h-5 flex items-center justify-center text-muted-foreground/20 hover:text-red-400 active:text-red-500 transition-colors shrink-0"
                  >
                    <Trash2 size={8} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation card */}
      {confirmDelete && (
        <div className="rounded-2xl border border-red-100 bg-red-50/70 px-3.5 py-3 flex flex-col gap-2.5">
          <div>
            <p className="text-[12px] font-medium text-foreground/80 mb-0.5">
              Excluir <strong>"{confirmDelete}"</strong> para sempre?
            </p>
            <p className="text-[11px] text-muted-foreground/55 leading-relaxed">
              Essa ação não pode ser desfeita. Que tal editar o nome em vez disso?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { startEdit(confirmDelete); setConfirmDelete(null); }}
              className="flex-1 h-8 rounded-xl text-[12px] font-semibold transition-colors"
              style={{ backgroundColor: `${CUSTOM_COLOR}15`, color: CUSTOM_COLOR }}
            >
              Editar nome
            </button>
            <button
              onClick={() => handleDelete(confirmDelete)}
              className="flex-1 h-8 rounded-xl bg-red-500 text-[12px] font-semibold text-white active:bg-red-600 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* Add new emotion */}
      {!isMaxed && (
        showNewInput ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 h-9 rounded-full border px-3"
              style={{ borderColor: `${CUSTOM_COLOR}50`, backgroundColor: `${CUSTOM_COLOR}08` }}>
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
              <button onClick={() => { setShowNewInput(false); setNewInput(''); }}
                className="text-muted-foreground/30 hover:text-muted-foreground/60 shrink-0">
                <X size={11} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={!newInput.trim()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-30 shrink-0"
              style={{ backgroundColor: CUSTOM_COLOR }}
            >
              <Plus size={14} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewInput(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium transition-colors"
            style={{ color: `${CUSTOM_COLOR}aa` }}
          >
            <Sparkles size={11} />
            {emotions.length > 0 ? 'Criar outra' : 'Criar emoção personalizada'}
          </button>
        )
      )}

    </div>
  );
}
