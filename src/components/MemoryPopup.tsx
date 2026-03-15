import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Pencil, Trash2, FileText, ImageIcon, Mic, Camera, Square, ChevronDown, ChevronUp, Check } from 'lucide-react';
import {
  PendulumEntry, getBobColor, getStatusLevel,
  PERIOD_CONFIG, DayPeriod,
  CONTEXTUAL_EMOTIONS, ORDERED_UNIVERSAL_EMOTIONS,
} from '@/lib/pendulum';
import { generateInsight } from '@/lib/insights';

// ─── Lerp ────────────────────────────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─── useBlink ─────────────────────────────────────────────────────────────────
// Only schedules blinks when eyes are visible (not for extreme states)
const useBlink = (enabled: boolean) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        setIsBlinking(true);
        timerRef.current = setTimeout(() => {
          setIsBlinking(false);
          schedule();
        }, 130);
      }, 2600 + Math.random() * 4000);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [enabled]);
  return isBlinking;
};

// ─── FaceSvg with blinking ───────────────────────────────────────────────────
const FaceSvg = ({ value }: { value: number }) => {
  const canBlink  = value > 11 && value < 89;
  const isBlinking = useBlink(canBlink);
  const mouthCtrlY = lerp(13, 35, value / 100);
  const eyeRY = isBlinking ? 0.2 : (value > 78 ? 2 : 3);
  const eyeY  = value > 78 ? 15 : 14;

  const renderEyes = () => {
    if (value <= 11) return (
      <>
        <path d="M 10,11 L 16,14 L 10,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
        <path d="M 30,11 L 24,14 L 30,17" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.88" />
      </>
    );
    if (value >= 89) return (
      <>
        <path d="M 10,16 Q 13,11 16,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88" />
        <path d="M 24,16 Q 27,11 30,16" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88" />
      </>
    );
    return (
      <>
        <ellipse cx="13" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" style={{ transition: 'ry 60ms ease' }} />
        <ellipse cx="27" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" style={{ transition: 'ry 60ms ease' }} />
      </>
    );
  };

  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {renderEyes()}
      <path
        d={`M 10,24 Q 20,${mouthCtrlY.toFixed(1)} 30,24`}
        stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88"
      />
    </svg>
  );
};

// ─── SpectrumBar ─────────────────────────────────────────────────────────────
const SpectrumBar = ({ position }: { position: number }) => {
  const color = getBobColor(position);
  return (
    <div className="relative h-2 rounded-full overflow-hidden">
      <div className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: `${position}%`, backgroundColor: color }} />
      <div className="absolute inset-y-0 right-0 rounded-r-full bg-muted" style={{ width: `${100 - position}%` }} />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-background z-10"
        style={{ left: `${position}%`, backgroundColor: color }}
      />
    </div>
  );
};

// ─── Mood labels ─────────────────────────────────────────────────────────────
const MOODS = [
  { label: 'Muuuito mal',   max: 11  },
  { label: 'Muuito mal',    max: 22  },
  { label: 'Muito mal',     max: 33  },
  { label: 'Mal',           max: 44  },
  { label: 'Mais ou menos', max: 56  },
  { label: 'Bem',           max: 67  },
  { label: 'Muito bem',     max: 78  },
  { label: 'Muuito bem',    max: 89  },
  { label: 'Muuuito bem',   max: 100 },
];
const getMoodLabel = (v: number) => MOODS.find(m => v <= m.max)?.label ?? 'Muuuito bem';

// ─── Date / time helpers ──────────────────────────────────────────────────────
const DIAS  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const formatEntryDate = (entry: PendulumEntry): string => {
  const [y, m, d] = entry.date.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS[date.getDay()]}, ${d} de ${MESES[m - 1]}`;
};
const formatEntryTime = (entry: PendulumEntry): string => {
  if (entry.timestamp) {
    const d = new Date(entry.timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  if (entry.period) return PERIOD_CONFIG[entry.period as DayPeriod].label;
  return '';
};

// ─── formatDur ───────────────────────────────────────────────────────────────
const formatDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ─── Section label row ────────────────────────────────────────────────────────
const SectionLabel = ({
  icon, label, onEdit, isEditing,
}: {
  icon: React.ReactNode;
  label: string;
  onEdit?: () => void;
  isEditing?: boolean;
}) => (
  <div className="flex items-center justify-between mb-2.5">
    <div className="flex items-center gap-1.5">
      <span className="text-muted-foreground/40">{icon}</span>
      <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">{label}</span>
    </div>
    {onEdit && (
      <button
        onClick={onEdit}
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
          isEditing ? 'bg-primary text-white' : 'bg-muted/60 text-muted-foreground/40 hover:text-muted-foreground/70'
        }`}
      >
        {isEditing ? <Check size={10} strokeWidth={2.5} /> : <Pencil size={10} />}
      </button>
    )}
  </div>
);

// ─── Props ───────────────────────────────────────────────────────────────────
interface MemoryPopupProps {
  entry: PendulumEntry;
  onClose: () => void;
  onSave: (updates: Partial<Pick<PendulumEntry, 'emotions' | 'note' | 'photo' | 'audio'>>) => void;
  onDelete: () => void;
}

// ─── MemoryPopup ─────────────────────────────────────────────────────────────
const MemoryPopup = ({ entry, onClose, onSave, onDelete }: MemoryPopupProps) => {
  const color       = getBobColor(entry.position);
  const moodLabel   = getMoodLabel(entry.position);
  const dateLabel   = formatEntryDate(entry);
  const timeLabel   = formatEntryTime(entry);
  const statusLevel = getStatusLevel(entry.position);

  // ── Edit field state ───────────────────────────────────────────────────────
  const [editField, setEditField] = useState<'emotions' | 'note' | 'photo' | 'audio' | null>(null);

  // ── Local edit values (reset from entry on open) ───────────────────────────
  const [editEmotions,  setEditEmotions]  = useState<string[]>(entry.emotions ?? []);
  const [editNote,      setEditNote]      = useState(entry.note ?? '');
  const [editPhoto,     setEditPhoto]     = useState<string | undefined>(entry.photo);
  const [editAudio,     setEditAudio]     = useState<string | undefined>(entry.audio);
  const [showMore,      setShowMore]      = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Audio recording ────────────────────────────────────────────────────────
  const [isRecording,  setIsRecording]  = useState(false);
  const [recDuration,  setRecDuration]  = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const recTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef    = useRef<HTMLInputElement>(null);

  // ── Emotion options ────────────────────────────────────────────────────────
  const contextualEmotions  = CONTEXTUAL_EMOTIONS[statusLevel];
  const universalFiltered   = useMemo(
    () => ORDERED_UNIVERSAL_EMOTIONS[statusLevel].filter(e => !contextualEmotions.includes(e)),
    [contextualEmotions, statusLevel],
  );
  const isMaxed = editEmotions.length >= 3;

  // ── Insight ────────────────────────────────────────────────────────────────
  const { line1, line2 } = generateInsight({
    statusLevel,
    position:  entry.position,
    emotions:  entry.emotions ?? [],
    note:      entry.note,
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleEmotion = (e: string) => {
    setEditEmotions(prev =>
      prev.includes(e) ? prev.filter(x => x !== e) : prev.length < 3 ? [...prev, e] : prev
    );
  };

  const handleSaveField = (field: typeof editField) => {
    if (field === 'emotions') onSave({ emotions: editEmotions });
    if (field === 'note')     onSave({ note: editNote.trim() || undefined });
    if (field === 'photo')    onSave({ photo: editPhoto });
    if (field === 'audio')    onSave({ audio: editAudio });
    setEditField(null);
  };

  const handleCancelField = (field: typeof editField) => {
    if (field === 'emotions') setEditEmotions(entry.emotions ?? []);
    if (field === 'note')     setEditNote(entry.note ?? '');
    if (field === 'photo')    setEditPhoto(entry.photo);
    if (field === 'audio')    { setEditAudio(entry.audio); stopRecording(); }
    setEditField(null);
  };

  const toggleField = (field: NonNullable<typeof editField>) => {
    if (editField === field) {
      handleSaveField(field);
    } else {
      if (editField) handleCancelField(editField);
      setEditField(field);
    }
  };

  // ── Photo ──────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Audio ──────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = ev => { if (ev.data.size > 0) chunksRef.current.push(ev.data); };
      recorder.onstop = () => {
        const blob   = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setEditAudio(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        if (recTimerRef.current) clearInterval(recTimerRef.current);
      };
      recorder.start();
      setIsRecording(true);
      setRecDuration(0);
      recTimerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch { /* mic unavailable */ }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recTimerRef.current) clearInterval(recTimerRef.current);
  };

  // ── Chip for emotion picker ────────────────────────────────────────────────
  const EmotionChip = ({ emotion }: { emotion: string }) => {
    const active   = editEmotions.includes(emotion);
    const disabled = isMaxed && !active;
    return (
      <button
        onClick={() => { if (!disabled) toggleEmotion(emotion); }}
        className={[
          'px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all duration-150 select-none',
          active
            ? 'text-white shadow-sm'
            : disabled
              ? 'bg-muted/40 text-muted-foreground/25'
              : 'bg-muted text-foreground/75 active:scale-[0.96]',
        ].join(' ')}
        style={active ? { backgroundColor: color, boxShadow: `0 2px 10px ${color}45` } : undefined}
      >
        {emotion}
      </button>
    );
  };

  // ── Scroll lock: impede body de mudar de tamanho ao abrir o popup ─────────
  useEffect(() => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prev = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
    document.body.style.overflow     = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow     = prev.overflow;
      document.body.style.paddingRight = prev.paddingRight;
    };
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    // z-[60] > z-50 do BottomNav, garante que o popup fique acima do menu
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Card — único container de overflow; elimina o aninhamento overflow-hidden + overflow-auto
          que causava reflow e shift de elementos ao abrir o popup */}
      <div className="scrollbar-hide relative w-full max-w-sm bg-background rounded-3xl shadow-2xl border border-border/30 animate-in slide-in-from-bottom-4 duration-300 max-h-[78dvh] overflow-y-auto overscroll-contain">

          {/* ── Top bar: delete left, close right ─────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-4 pb-1">
            <button
              onClick={() => setShowDeleteConfirm(v => !v)}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                showDeleteConfirm ? 'bg-red-500 text-white' : 'bg-muted/60 text-muted-foreground/40 hover:text-red-400'
              }`}
            >
              <Trash2 size={12} />
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Delete confirmation — enfático */}
          {showDeleteConfirm && (
            <div className="mx-5 mb-2 rounded-2xl bg-red-50 border border-red-200 overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <p className="text-[13px] font-bold text-red-700 leading-snug mb-1.5">
                  ⚠️ Isso não tem volta
                </p>
                <p className="text-[12px] text-red-600/80 leading-relaxed">
                  Essa memória será excluída da sua biblioteca <span className="font-semibold">para sempre</span>. Você não consegue fazer um novo registro em datas/horas passadas.
                </p>
                <p className="text-[12px] text-red-600/80 leading-relaxed mt-1.5">
                  Se quiser mudar algo, use os campos de edição abaixo.
                </p>
              </div>
              <div className="flex border-t border-red-200">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 text-[12px] font-semibold text-muted-foreground/60 hover:text-muted-foreground transition-colors border-r border-red-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 py-2.5 text-[12px] font-bold text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors"
                >
                  Apagar mesmo assim
                </button>
              </div>
            </div>
          )}

          {/* ── Hero: face + mood + date ────────────────────────────────────── */}
          <div className="flex flex-col items-center pt-3 pb-5 px-6">
            <div
              className="relative w-20 h-20 rounded-full mb-4"
              style={{ backgroundColor: color, boxShadow: `0 6px 24px ${color}55` }}
            >
              <FaceSvg value={entry.position} />
            </div>
            <span className="text-[20px] font-bold leading-none mb-1" style={{ color }}>
              {moodLabel}
            </span>
            <span className="text-[12px] text-muted-foreground/50 font-medium mt-1">
              {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
            </span>
          </div>

          {/* Spectrum bar */}
          <div className="px-6 pb-5">
            <SpectrumBar position={entry.position} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wide">Horrível</span>
              <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wide">Incrível</span>
            </div>
          </div>

          {/* ── EMOÇÕES ─────────────────────────────────────────────────────── */}
          <div className="mx-6 border-t border-border/20 mb-4" />
          <div className="px-6 pb-4">
            <SectionLabel
              icon={<span className="text-[11px]">🫀</span>}
              label="Emoções"
              onEdit={() => toggleField('emotions')}
              isEditing={editField === 'emotions'}
            />

            {editField === 'emotions' ? (
              <>
                {editEmotions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {editEmotions.map(e => (
                      <span
                        key={e}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium leading-none border"
                        style={{ backgroundColor: `${color}22`, color, borderColor: `${color}44` }}
                      >
                        {e}
                      </span>
                    ))}
                    <span className="text-[10px] text-muted-foreground/40 self-center">
                      {editEmotions.length}/3
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  {contextualEmotions.map(e => <EmotionChip key={e} emotion={e} />)}
                </div>
                <button
                  onClick={() => setShowMore(v => !v)}
                  className="flex items-center gap-1 text-[12px] text-muted-foreground/45 hover:text-muted-foreground/65 transition-colors mb-2"
                >
                  {showMore ? <><ChevronUp size={12} /> Ver menos</> : <><ChevronDown size={12} /> + Ver mais emoções</>}
                </button>
                {showMore && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {universalFiltered.map(e => <EmotionChip key={e} emotion={e} />)}
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleCancelField('emotions')}
                    className="flex-1 h-8 rounded-xl border border-border text-[11px] font-medium text-muted-foreground active:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveField('emotions')}
                    className="flex-1 h-8 rounded-xl bg-primary text-white text-[11px] font-semibold active:opacity-90 transition-opacity"
                  >
                    Salvar
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {(entry.emotions?.length ?? 0) > 0
                  ? entry.emotions!.map(emotion => (
                      <span
                        key={emotion}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium leading-none bg-primary/15 text-primary border border-primary/20"
                      >
                        {emotion}
                      </span>
                    ))
                  : <span className="text-[12px] text-muted-foreground/35 italic">Nenhuma emoção registrada</span>
                }
              </div>
            )}
          </div>

          {/* ── REGISTRO (note) ─────────────────────────────────────────────── */}
          <div className="mx-6 border-t border-border/20 mb-4" />
          <div className="px-6 pb-4">
            <SectionLabel
              icon={<FileText size={11} />}
              label="Registro"
              onEdit={() => toggleField('note')}
              isEditing={editField === 'note'}
            />
            {editField === 'note' ? (
              <>
                <textarea
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[80px] leading-relaxed mb-2"
                  style={{ fontSize: '16px' }}
                  placeholder="Escreva algo sobre esse momento..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelField('note')}
                    className="flex-1 h-8 rounded-xl border border-border text-[11px] font-medium text-muted-foreground active:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveField('note')}
                    className="flex-1 h-8 rounded-xl bg-primary text-white text-[11px] font-semibold active:opacity-90 transition-opacity"
                  >
                    Salvar
                  </button>
                </div>
              </>
            ) : (
              entry.note
                ? <p className="text-[14px] text-foreground/80 leading-relaxed">{entry.note}</p>
                : <span className="text-[12px] text-muted-foreground/35 italic">Nenhum texto registrado</span>
            )}
          </div>

          {/* ── FOTO ────────────────────────────────────────────────────────── */}
          <div className="mx-6 border-t border-border/20 mb-4" />
          <div className="px-6 pb-4">
            <SectionLabel
              icon={<ImageIcon size={11} />}
              label="Foto"
              onEdit={() => toggleField('photo')}
              isEditing={editField === 'photo'}
            />
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            {editField === 'photo' ? (
              <>
                {editPhoto ? (
                  <div className="relative mb-2">
                    <img src={editPhoto} alt="" className="rounded-2xl w-full max-h-52 object-cover" />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="h-7 px-2.5 rounded-lg bg-black/50 text-white text-[11px] font-medium flex items-center gap-1"
                      >
                        <Camera size={11} /> Trocar
                      </button>
                      <button
                        onClick={() => setEditPhoto(undefined)}
                        className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/60 text-[13px] text-muted-foreground/60 hover:border-primary/40 hover:text-primary transition-colors mb-2"
                  >
                    <Camera size={14} /> Adicionar foto
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelField('photo')}
                    className="flex-1 h-8 rounded-xl border border-border text-[11px] font-medium text-muted-foreground active:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveField('photo')}
                    className="flex-1 h-8 rounded-xl bg-primary text-white text-[11px] font-semibold active:opacity-90 transition-opacity"
                  >
                    Salvar
                  </button>
                </div>
              </>
            ) : (
              entry.photo
                ? <img src={entry.photo} alt="" className="rounded-2xl w-full max-h-52 object-cover" />
                : (
                  <button
                    onClick={() => toggleField('photo')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/40 text-[12px] text-muted-foreground/35 hover:border-primary/30 hover:text-primary/60 transition-colors"
                  >
                    <Camera size={13} /> Adicionar foto
                  </button>
                )
            )}
          </div>

          {/* ── ÁUDIO ───────────────────────────────────────────────────────── */}
          <div className="mx-6 border-t border-border/20 mb-4" />
          <div className="px-6 pb-4">
            <SectionLabel
              icon={<Mic size={11} />}
              label="Áudio"
              onEdit={() => { if (!isRecording) toggleField('audio'); }}
              isEditing={editField === 'audio'}
            />
            {editField === 'audio' ? (
              <>
                {isRecording ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[12px] text-red-500 font-medium flex-1">{formatDur(recDuration)}</span>
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[11px] font-medium"
                    >
                      <Square size={9} fill="white" /> Parar
                    </button>
                  </div>
                ) : editAudio ? (
                  <div className="flex items-center gap-2 mb-2">
                    <audio src={editAudio} controls className="flex-1 h-8 min-w-0" />
                    <button
                      onClick={startRecording}
                      className="h-8 px-2.5 rounded-lg border border-border text-[11px] text-muted-foreground font-medium flex items-center gap-1 shrink-0"
                    >
                      <Mic size={11} /> Regravar
                    </button>
                    <button
                      onClick={() => setEditAudio(undefined)}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/60 text-[13px] text-muted-foreground/60 hover:border-primary/40 hover:text-primary transition-colors mb-2"
                  >
                    <Mic size={14} /> Gravar áudio
                  </button>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelField('audio')}
                    className="flex-1 h-8 rounded-xl border border-border text-[11px] font-medium text-muted-foreground active:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSaveField('audio')}
                    className="flex-1 h-8 rounded-xl bg-primary text-white text-[11px] font-semibold active:opacity-90 transition-opacity"
                  >
                    Salvar
                  </button>
                </div>
              </>
            ) : (
              entry.audio
                ? <audio src={entry.audio} controls className="w-full h-9" />
                : (
                  <button
                    onClick={() => toggleField('audio')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-border/40 text-[12px] text-muted-foreground/35 hover:border-primary/30 hover:text-primary/60 transition-colors"
                  >
                    <Mic size={13} /> Gravar áudio
                  </button>
                )
            )}
          </div>

          {/* ── INSIGHT ─────────────────────────────────────────────────────── */}
          <div className="mx-6 border-t border-border/20 mb-4" />
          <div className="px-6 pb-7">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[13px]">✨</span>
              <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
                Pensamento do momento
              </span>
            </div>
            <p className="text-[13px] text-foreground/55 leading-relaxed mb-3">{line1}</p>
            <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3.5">
              <p className="text-[14px] font-semibold text-primary leading-snug">{line2}</p>
            </div>
          </div>

      </div>
    </div>
  );
};

export default MemoryPopup;
