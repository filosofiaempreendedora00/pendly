import { useState, useEffect, useCallback } from 'react';
import {
  getEntries, deleteEntry, updateEntryNote,
  PendulumEntry, getTodayKey, getLocalDateKey, PERIOD_CONFIG, DayPeriod,
} from '@/lib/pendulum';
import { ChevronDown, ChevronUp, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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

// ─── Cor do bob ───────────────────────────────────────────────────────────────
const COLOR_STOPS = [
  { pos: 0,   h: 0,   s: 72, l: 52 },
  { pos: 22,  h: 8,   s: 74, l: 54 },
  { pos: 33,  h: 16,  s: 75, l: 54 },
  { pos: 44,  h: 26,  s: 80, l: 56 },
  { pos: 50,  h: 215, s: 50, l: 58 },
  { pos: 56,  h: 215, s: 50, l: 58 },
  { pos: 67,  h: 152, s: 44, l: 50 },
  { pos: 78,  h: 148, s: 52, l: 44 },
  { pos: 89,  h: 145, s: 60, l: 40 },
  { pos: 100, h: 143, s: 68, l: 33 },
];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const getBobColor = (v: number): string => {
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    const prev = COLOR_STOPS[i - 1];
    const curr = COLOR_STOPS[i];
    if (v <= curr.pos) {
      const range = curr.pos - prev.pos;
      const t = range === 0 ? 0 : (v - prev.pos) / range;
      const useT = (prev.h < 50 && curr.h > 100) ? (t < 0.5 ? 0 : 1) : t;
      return `hsl(${Math.round(lerp(prev.h, curr.h, useT))}, ${Math.round(lerp(prev.s, curr.s, t))}%, ${Math.round(lerp(prev.l, curr.l, t))}%)`;
    }
  }
  const last = COLOR_STOPS[COLOR_STOPS.length - 1];
  return `hsl(${last.h}, ${last.s}%, ${last.l}%)`;
};

// ─── FaceSvg ──────────────────────────────────────────────────────────────────
const FaceSvg = ({ value }: { value: number }) => {
  const mouthControlY = lerp(13, 35, value / 100);
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
        <ellipse cx="13" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" />
        <ellipse cx="27" cy={eyeY} rx="2.5" ry={eyeRY} fill="white" opacity="0.88" />
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
const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

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
  const [expanded, setExpanded]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [editMode, setEditMode]   = useState(false);
  const [noteValue, setNoteValue] = useState(entry.note ?? '');

  const handleSave = () => {
    if (entry.timestamp) updateEntryNote(entry.timestamp, noteValue);
    setEditMode(false);
    setMenuOpen(false);
    onEdited();
  };

  const handleCancelEdit = () => {
    setNoteValue(entry.note ?? '');
    setEditMode(false);
    setMenuOpen(false);
  };

  return (
    <div className={isFirst ? '' : 'mt-6'}>
      {/* Linha principal */}
      <div className="flex items-center gap-3 relative">
        {/* Bob */}
        <div
          className="relative w-11 h-11 rounded-full shrink-0 z-10"
          style={{ backgroundColor: color, boxShadow: `0 2px 10px ${color}50` }}
        >
          <FaceSvg value={entry.position} />
        </div>

        {/* Label + horário + emoções */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-0">
            <span className="text-[15px] font-semibold" style={{ color }}>{label}</span>
            {time && (
              <span className="ml-2 text-xs text-muted-foreground/40 font-medium">{time}</span>
            )}
          </div>
          {entry.emotions && entry.emotions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {entry.emotions.map(emotion => (
                <span
                  key={emotion}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium leading-none bg-muted text-muted-foreground/60 border border-border/50"
                >
                  {emotion}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-0 shrink-0">
          {hasDetails && !editMode && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-muted-foreground/35 hover:text-muted-foreground transition-colors p-1"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          )}
          <button
            onClick={() => { setMenuOpen(v => !v); setExpanded(false); }}
            className={`p-1.5 rounded-lg transition-colors ${
              menuOpen ? 'text-foreground bg-muted' : 'text-muted-foreground/35 hover:text-muted-foreground'
            }`}
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Menu de ações */}
      {menuOpen && !editMode && (
        <div className="mt-2.5 ml-[3.5rem] flex gap-2 entry-menu-in">
          <button
            onClick={() => { setEditMode(true); setExpanded(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-medium text-foreground/70 active:bg-muted/70 transition-colors"
          >
            <Pencil size={12} />
            Editar nota
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
        <div className="mt-2 ml-[3.5rem] entry-menu-in">
          <textarea
            value={noteValue}
            onChange={e => setNoteValue(e.target.value)}
            className="w-full rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[80px] leading-relaxed"
            style={{ fontSize: '16px' }}
            placeholder="Escreva uma nota..."
            autoFocus
          />
          <div className="flex gap-2 mt-2">
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
  date, entries, onRequestDelete, onEdited,
}: {
  date: string;
  entries: PendulumEntry[];
  onRequestDelete: (entry: PendulumEntry) => void;
  onEdited: () => void;
}) => {
  const { main, sub } = formatDateHeader(date);
  const bobHalf = 22; // w-11/2

  return (
    <div className="mx-4 mb-4 rounded-2xl bg-background shadow-sm overflow-hidden border border-border/30">
      {/* Cabeçalho */}
      <div className="px-4 pt-3 pb-2 flex items-baseline gap-2">
        <span className="text-[13px] font-bold text-foreground">{main}</span>
        <span className="text-[11px] text-muted-foreground/50 font-medium">{sub}</span>
      </div>
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
  const [groups, setGroups]           = useState<{ date: string; entries: PendulumEntry[] }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<PendulumEntry | null>(null);

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
    if (!deleteTarget?.timestamp) return;
    deleteEntry(deleteTarget.timestamp);
    setDeleteTarget(null);
    reload();
  };

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
        <div className="px-5 pt-10 pb-5">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Biblioteca de Emoções</h2>
        </div>

        {groups.map(({ date, entries: dayEntries }) => (
          <DayCard
            key={date}
            date={date}
            entries={dayEntries}
            onRequestDelete={setDeleteTarget}
            onEdited={reload}
          />
        ))}
      </div>

      {/* Popup de confirmação de exclusão */}
      {deleteTarget && (
        <DeletePopup
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  );
};

export default BibliotecaPage;
