import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getEntries, deleteEntryFlex, updateEntry,
  PendulumEntry, getTodayKey, getLocalDateKey, PERIOD_CONFIG, DayPeriod,
  getTodayEntryCount, DAILY_FREE_LIMIT, getBobColor,
} from '@/lib/pendulum';
import { MoreHorizontal, Pencil, Trash2, FileText, ImageIcon, Mic, Camera, X, Square, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import PaywallPopup from '@/components/PaywallPopup';

// ─── Mood labels ──────────────────────────────────────────────────────────────
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

// ─── Lerp (usado pelo FaceSvg) ───────────────────────────────────────────────
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
// getBobColor é importado de @/lib/pendulum — fonte única da verdade

// ─── FaceSvg ──────────────────────────────────────────────────────────────────
const FaceSvg = ({ value }: { value: number }) => {
  // Delay e duração únicos por instância — piscadas dessincronizadas
  const blinkDelay    = useRef(`${(Math.random() * 6).toFixed(2)}s`).current;
  const blinkDuration = useRef(`${(3.2 + Math.random() * 2.4).toFixed(2)}s`).current;

  const mouthControlY = lerp(13, 35, value / 100);
  const canBlink = value > 11 && value < 89;

  const eyeStyle: React.CSSProperties = canBlink ? {
    animation:       `face-blink ${blinkDuration} ${blinkDelay} infinite`,
    transformBox:    'fill-box',
    transformOrigin: 'center',
  } : {};

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
    const eyeRY = value > 78 ? 2 : 3;
    const eyeY  = value > 78 ? 15 : 14;
    return (
      <>
        <ellipse cx="13" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" style={eyeStyle} />
        <ellipse cx="27" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" style={eyeStyle} />
      </>
    );
  };
  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      {renderEyes()}
      <path
        d={`M 10,24 Q 20,${mouthControlY.toFixed(1)} 30,24`}
        stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.88"
      />
    </svg>
  );
};

// ─── Helpers de data ──────────────────────────────────────────────────────────
const DIAS_SEMANA  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_CURTO  = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGO  = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const MESES_TITULO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const parseDateKey = (dateKey: string) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDateHeader = (dateKey: string) => {
  const todayKey     = getTodayKey();
  const yesterdayKey = getLocalDateKey(new Date(Date.now() - 86_400_000));
  const date = parseDateKey(dateKey);
  const d    = date.getDate();
  const m    = date.getMonth();
  const dia  = DIAS_SEMANA[date.getDay()];

  if (dateKey === todayKey)     return { main: 'Hoje',  sub: `${dia}, ${d} de ${MESES_LONGO[m]}` };
  if (dateKey === yesterdayKey) return { main: 'Ontem', sub: `${dia}, ${d} de ${MESES_LONGO[m]}` };
  return { main: dia, sub: `${d} de ${MESES_CURTO[m]}.` };
};

const formatTime = (entry: PendulumEntry): string => {
  if (entry.timestamp) {
    const d = new Date(entry.timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  if (entry.period) return PERIOD_CONFIG[entry.period as DayPeriod].label;
  return '';
};

// ─── Delete popup ─────────────────────────────────────────────────────────────
const DeletePopup = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/25 backdrop-blur-sm"
      onClick={onCancel}
    />
    {/* Card */}
    <div className="relative w-full max-w-xs bg-background rounded-3xl p-6 popup-slide-in shadow-2xl">
      {/* Ícone animado */}
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center trash-wobble">
          <Trash2 size={26} className="text-red-400" strokeWidth={1.8} />
        </div>
      </div>

      <h3 className="text-[17px] font-semibold text-foreground text-center mb-2">
        Apagar esse momento?
      </h3>
      <p className="text-[13px] text-muted-foreground text-center leading-relaxed mb-6">
        Essa memória vai sair da sua Biblioteca de Emoções pra sempre. Não tem como recuperar.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-2xl border border-border text-sm font-medium text-foreground active:bg-muted transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 h-11 rounded-2xl bg-red-500 text-white text-sm font-semibold active:bg-red-600 transition-colors"
        >
          Apagar
        </button>
      </div>
    </div>
  </div>
);

// ─── EntryInline ──────────────────────────────────────────────────────────────
const formatDur = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

const EntryInline = ({
  entry, color, label, time, hasDetails, isFirst, onRequestDelete, onEdited,
}: {
  entry: PendulumEntry;
  color: string;
  label: string;
  time: string;
  hasDetails: boolean;
  isFirst: boolean;
  onRequestDelete: (entry: PendulumEntry) => void;
  onEdited: () => void;
}) => {
  const [expanded, setExpanded]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [editMode, setEditMode]       = useState(false);
  const [noteValue, setNoteValue]     = useState(entry.note ?? '');
  const [photoValue, setPhotoValue]   = useState<string | undefined>(entry.photo);
  const [audioValue, setAudioValue]   = useState<string | undefined>(entry.audio);
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);

  const photoInputRef    = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSave = () => {
    if (entry.timestamp) updateEntry(entry.timestamp, { note: noteValue, photo: photoValue, audio: audioValue });
    setEditMode(false);
    setMenuOpen(false);
    onEdited();
  };

  const handleCancelEdit = () => {
    setNoteValue(entry.note ?? '');
    setPhotoValue(entry.photo);
    setAudioValue(entry.audio);
    setEditMode(false);
    setMenuOpen(false);
    if (isRecording) stopRecording();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoValue(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => setAudioValue(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      recorder.start();
      setIsRecording(true);
      setRecDuration(0);
      timerRef.current = setInterval(() => setRecDuration(d => d + 1), 1000);
    } catch { /* mic unavailable */ }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className={isFirst ? '' : 'mt-6'}>
      {/* Linha principal — toque expande detalhes */}
      <div
        className="flex items-center gap-3 relative"
        onClick={() => { if (hasDetails && !editMode) setExpanded(v => !v); }}
        style={{ cursor: hasDetails && !editMode ? 'pointer' : 'default' }}
      >
        {/* Bob */}
        <div
          className="relative w-11 h-11 rounded-full shrink-0 z-10"
          style={{ backgroundColor: color, boxShadow: `0 2px 10px ${color}50` }}
        >
          <FaceSvg value={entry.position} />
        </div>

        {/* Label + horário + emoções + indicadores */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-0">
            <span className="text-[15px] font-semibold" style={{ color }}>{label}</span>
            {time && (
              <span className="ml-2 text-xs text-muted-foreground/40 font-medium">{time}</span>
            )}
          </div>
          {(entry.emotions?.length || entry.note || entry.photo || entry.audio) && (
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {entry.emotions?.map(emotion => (
                <span
                  key={emotion}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium leading-none bg-primary/15 text-primary border border-primary/20"
                >
                  {emotion}
                </span>
              ))}
              {entry.note && (
                <span className="w-[18px] h-[18px] rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText size={9} className="text-primary/70" />
                </span>
              )}
              {entry.photo && (
                <span className="w-[18px] h-[18px] rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ImageIcon size={9} className="text-primary/70" />
                </span>
              )}
              {entry.audio && (
                <span className="w-[18px] h-[18px] rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mic size={9} className="text-primary/70" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Único ícone de ações */}
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); setExpanded(false); }}
          className={`p-1.5 rounded-lg transition-colors shrink-0 ${
            menuOpen ? 'text-foreground bg-muted' : 'text-muted-foreground/30 hover:text-muted-foreground'
          }`}
        >
          <MoreHorizontal size={15} />
        </button>
      </div>

      {/* Menu de ações */}
      {menuOpen && !editMode && (
        <div className="mt-2.5 ml-[3.5rem] flex gap-2 entry-menu-in">
          <button
            onClick={() => { setEditMode(true); setExpanded(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-xs font-medium text-primary active:bg-primary/20 transition-colors"
          >
            <Pencil size={12} />
            Editar registro
          </button>
          <button
            onClick={() => { onRequestDelete(entry); setMenuOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-xs font-medium text-red-500 active:bg-red-100 transition-colors"
          >
            <Trash2 size={12} />
            Excluir
          </button>
        </div>
      )}

      {/* Detalhes expandidos */}
      {expanded && hasDetails && !editMode && (
        <div className="mt-2 ml-[3.5rem] flex flex-col gap-2.5">
          {entry.note && (
            <p className="text-sm text-muted-foreground leading-relaxed">{entry.note}</p>
          )}
          {entry.photo && (
            <img src={entry.photo} alt="" className="rounded-xl max-h-48 w-full object-cover" />
          )}
          {entry.audio && (
            <audio src={entry.audio} controls className="w-full h-8" />
          )}
        </div>
      )}

      {/* Modo edição */}
      {editMode && (
        <div className="mt-3 ml-[3.5rem] entry-menu-in flex flex-col gap-3">

          {/* Nota */}
          <textarea
            value={noteValue}
            onChange={e => setNoteValue(e.target.value)}
            className="w-full rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[72px] leading-relaxed"
            style={{ fontSize: '16px' }}
            placeholder="Nota de texto..."
          />

          {/* Foto */}
          <div className="flex flex-col gap-1.5">
            {photoValue ? (
              <div className="relative">
                <img src={photoValue} alt="" className="rounded-xl max-h-40 w-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="h-7 px-2.5 rounded-lg bg-black/50 text-white text-[11px] font-medium flex items-center gap-1"
                  >
                    <Camera size={11} /> Trocar
                  </button>
                  <button
                    onClick={() => setPhotoValue(undefined)}
                    className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground/60 hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Camera size={13} /> Adicionar foto
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Áudio */}
          <div className="flex flex-col gap-1.5">
            {isRecording ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-500 font-medium flex-1">{formatDur(recDuration)}</span>
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500 text-white text-[11px] font-medium"
                >
                  <Square size={10} fill="white" /> Parar
                </button>
              </div>
            ) : audioValue ? (
              <div className="flex items-center gap-2">
                <audio src={audioValue} controls className="flex-1 h-8 min-w-0" />
                <button
                  onClick={startRecording}
                  className="h-8 px-2.5 rounded-lg border border-border text-[11px] text-muted-foreground font-medium flex items-center gap-1 shrink-0"
                >
                  <Mic size={11} /> Regravar
                </button>
                <button
                  onClick={() => setAudioValue(undefined)}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground shrink-0"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border/60 text-xs text-muted-foreground/60 hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Mic size={13} /> Adicionar áudio
              </button>
            )}
          </div>

          {/* Salvar / Cancelar */}
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              className="flex-1 h-9 rounded-xl border border-border text-xs font-medium text-muted-foreground active:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-9 rounded-xl bg-primary text-white text-xs font-semibold active:opacity-90 transition-opacity"
            >
              Salvar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── DayCard ──────────────────────────────────────────────────────────────────
const DayCard = ({
  date, entries, onRequestDelete, onEdited, onAddNew,
}: {
  date: string;
  entries: PendulumEntry[];
  onRequestDelete: (entry: PendulumEntry) => void;
  onEdited: () => void;
  onAddNew?: () => void;
}) => {
  const { main, sub } = formatDateHeader(date);
  const bobHalf = 22; // w-11/2
  const isToday = date === getTodayKey();

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-background shadow-sm border border-border/30 relative">
      {/* Cabeçalho */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <span className="text-[13px] font-bold text-foreground">{main}</span>
        <span className="text-[11px] text-muted-foreground/50 font-medium">{sub}</span>
      </div>
      {isToday && onAddNew && (
        <button
          onClick={onAddNew}
          className="absolute -top-4 right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/40"
        >
          <Plus size={16} strokeWidth={2.6} className="text-white" />
        </button>
      )}
      <div className="mx-4 border-t border-border/30" />

      {/* Registros */}
      <div className="px-4 py-3 relative">
        {entries.length > 1 && (
          <div
            className="absolute w-px"
            style={{
              backgroundColor: 'rgb(170, 170, 170)',
              left: `calc(1rem + ${bobHalf}px)`,
              top:  `calc(0.75rem + ${bobHalf}px)`,
              bottom: `calc(0.75rem + ${bobHalf}px)`,
            }}
          />
        )}
        {entries.map((entry, i) => (
          <EntryInline
            key={`${entry.timestamp ?? entry.period}-${i}`}
            entry={entry}
            color={getBobColor(entry.position)}
            label={getMoodLabel(entry.position)}
            time={formatTime(entry)}
            hasDetails={!!(entry.note || entry.photo || entry.audio)}
            isFirst={i === 0}
            onRequestDelete={onRequestDelete}
            onEdited={onEdited}
          />
        ))}
      </div>
    </div>
  );
};

// ─── BibliotecaPage ───────────────────────────────────────────────────────────
const BibliotecaPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups]             = useState<{ date: string; entries: PendulumEntry[] }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PendulumEntry | null>(null);
  const [showPaywall, setShowPaywall]   = useState(false);

  // ── Filtro de mês ────────────────────────────────────────────────────────────
  const _today    = new Date();
  const [navYear,  setNavYear]  = useState(_today.getFullYear());
  const [navMonth, setNavMonth] = useState(_today.getMonth());
  const isAtCurrent = navYear === _today.getFullYear() && navMonth === _today.getMonth();

  const goToPrev = () => {
    if (navMonth === 0) { setNavYear(y => y - 1); setNavMonth(11); }
    else setNavMonth(m => m - 1);
  };
  const goToNext = () => {
    if (isAtCurrent) return;
    if (navMonth === 11) { setNavYear(y => y + 1); setNavMonth(0); }
    else setNavMonth(m => m + 1);
  };

  const handleAddNew = () => {
    if (getTodayEntryCount() >= DAILY_FREE_LIMIT) {
      setShowPaywall(true);
    } else {
      navigate('/');
    }
  };

  const reload = useCallback(() => {
    const all = getEntries().sort((a, b) => {
      const ta = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date).getTime();
      const tb = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date).getTime();
      return tb - ta;
    });
    const grouped: { date: string; entries: PendulumEntry[] }[] = [];
    for (const entry of all) {
      const last = grouped[grouped.length - 1];
      if (last && last.date === entry.date) last.entries.push(entry);
      else grouped.push({ date: entry.date, entries: [entry] });
    }
    setGroups(grouped);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteEntryFlex(deleteTarget);
    setDeleteTarget(null);
    reload();
  };

  // Grupos filtrados pelo mês selecionado
  const filteredGroups = groups.filter(({ date }) => {
    const [y, m] = date.split('-').map(Number);
    return y === navYear && m - 1 === navMonth;
  });

  if (groups.length === 0) {
    return (
      <div className="flex flex-col min-h-screen pb-[88px] items-center justify-center text-center px-8 bg-muted/30">
        <p className="text-4xl mb-4">📖</p>
        <p className="text-sm text-muted-foreground">Seus registros de humor aparecerão aqui.</p>
        <p className="text-xs text-muted-foreground/40 mt-1">Comece registrando na aba Pêndulo.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen pb-[88px] bg-muted/30">
        {/* Header */}
        <div className="px-5 pt-10 pb-3">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Biblioteca de Emoções</h2>
        </div>

        {/* ── Seletor de mês ─────────────────────────────────────────────────── */}
        <div className="px-5 pb-4 flex items-center gap-0.5">
          <button
            onClick={goToPrev}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground/50 hover:bg-muted active:bg-muted/80 transition-colors"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="text-[13px] font-semibold text-foreground/70 w-[108px] text-center">
            {MESES_TITULO[navMonth]} {navYear}
          </span>
          <button
            onClick={goToNext}
            disabled={isAtCurrent}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isAtCurrent
                ? 'opacity-20 cursor-default'
                : 'text-muted-foreground/50 hover:bg-muted active:bg-muted/80'
            }`}
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {filteredGroups.length > 0 ? (
          filteredGroups.map(({ date, entries: dayEntries }) => (
            <DayCard
              key={date}
              date={date}
              entries={dayEntries}
              onRequestDelete={setDeleteTarget}
              onEdited={reload}
              onAddNew={handleAddNew}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
            <p className="text-3xl mb-3">🗓️</p>
            <p className="text-sm text-muted-foreground">
              Nenhum registro em {MESES_LONGO[navMonth]}.
            </p>
          </div>
        )}
      </div>

      {/* Popup de confirmação de exclusão */}
      {deleteTarget && (
        <DeletePopup
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Paywall: limite diário */}
      {showPaywall && (
        <PaywallPopup
          onClose={() => setShowPaywall(false)}
          onManageToday={() => setShowPaywall(false)}
        />
      )}
    </>
  );
};

export default BibliotecaPage;
