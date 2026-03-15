import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  CONTEXTUAL_EMOTIONS,
  ORDERED_UNIVERSAL_EMOTIONS,
  type StatusLevel,
} from '@/lib/pendulum';
import { ChevronDown, ChevronUp, ArrowLeft, Mic, MicOff, ImagePlus, X } from 'lucide-react';

interface EmotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (emotions: string[], note?: string, photo?: string, audio?: string) => void;
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
  // ── Step 1 state ────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<string[]>([]);
  const [showMore, setShowMore] = useState(false);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 2 state ────────────────────────────────────────────────────────────
  const [note, setNote] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState('');
  const [audioDataUrl, setAudioDataUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef        = useRef<Blob[]>([]);
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoInputRef    = useRef<HTMLInputElement>(null);

  const contextual = CONTEXTUAL_EMOTIONS[statusLevel];
  const universalFiltered = useMemo(
    () => ORDERED_UNIVERSAL_EMOTIONS[statusLevel].filter(e => !contextual.includes(e)),
    [contextual, statusLevel],
  );

  const isMaxed = selected.length >= 3;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const toggle = (emotion: string) => {
    setSelected(prev => {
      if (prev.includes(emotion)) return prev.filter(e => e !== emotion);
      if (prev.length >= 3) return prev;
      return [...prev, emotion];
    });
  };

  const resetAll = () => {
    setSelected([]);
    setShowMore(false);
    setStep(1);
    setNote('');
    setPhotoDataUrl('');
    setAudioDataUrl('');
    setIsRecording(false);
    setRecordingDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleClose   = () => { resetAll(); onClose(); };
  const handleNext    = () => { if (selected.length > 0) setStep(2); };
  const handleBack    = () => setStep(1);

  const handleConfirm = () => {
    onConfirm(
      selected,
      note.trim() || undefined,
      photoDataUrl || undefined,
      audioDataUrl || undefined,
    );
    resetAll();
  };

  // ── Photo ───────────────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhotoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Audio ───────────────────────────────────────────────────────────────────
  const formatDuration = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

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
        reader.onloadend = () => setAudioDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
      };
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch {
      // microphone not available
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (!isOpen) return null;

  // ── Chip ─────────────────────────────────────────────────────────────────────
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
        style={active ? { backgroundColor: bobColor, boxShadow: `0 2px 10px ${bobColor}45` } : undefined}
      >
        {emotion}
      </button>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
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

        {/* Step progress bar */}
        <div className="mx-6 mt-4 mb-0.5 h-[3px] rounded-full bg-muted-foreground/10 shrink-0 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-in-out"
            style={{ width: step === 1 ? '50%' : '100%', backgroundColor: bobColor }}
          />
        </div>

        {/* ──────────────────── STEP 1: emoções ──────────────────── */}
        {step === 1 && (
          <>
            <div className="px-6 pt-4 pb-3 shrink-0">
              <h2 className="text-lg font-semibold text-foreground leading-snug">
                Quais emoções mais descrevem você agora?
              </h2>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground">Escolha até 3 opções</p>
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

            <div className="flex-1 overflow-y-auto px-6 pb-1">
              <div className="flex flex-wrap gap-2 pt-1 pb-5">
                {contextual.map(e => <Chip key={e} emotion={e} />)}
              </div>

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

              {!showMore && <div className="pb-3" />}
            </div>

            <div
              className="px-6 pt-3 border-t border-border/40 shrink-0"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <Button
                onClick={handleNext}
                disabled={selected.length === 0}
                className="w-full rounded-full h-12 text-sm font-medium"
              >
                Próximo →
              </Button>
            </div>
          </>
        )}

        {/* ──────────────────── STEP 2: reflexão ──────────────────── */}
        {step === 2 && (
          <>
            <div className="px-6 pt-3 pb-3 shrink-0">
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground/70 transition-colors mb-3"
              >
                <ArrowLeft size={13} /> Voltar
              </button>
              <h2 className="text-lg font-semibold text-foreground leading-snug">
                O que você acha que te fez sentir assim?
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Se quiser, registre algo sobre este momento.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-1 flex flex-col gap-3">

              {/* Text note */}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Escreva aqui..."
                className="w-full rounded-2xl bg-muted/50 border border-border/40 px-4 py-3 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:ring-1 focus:ring-border/60 min-h-[96px]"
                style={{ fontSize: '16px' }}
              />

              {/* Photo */}
              <div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoDataUrl ? (
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={photoDataUrl} alt="Foto anexada" className="w-full max-h-48 object-cover" />
                    <button
                      onClick={() => setPhotoDataUrl('')}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center"
                    >
                      <X size={13} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full flex items-center gap-3 rounded-2xl bg-muted/50 border border-border/40 px-4 py-3 text-sm text-muted-foreground/60 hover:text-muted-foreground/80 transition-colors"
                  >
                    <ImagePlus size={16} />
                    Adicionar foto
                  </button>
                )}
              </div>

              {/* Audio */}
              <div>
                {audioDataUrl ? (
                  <div className="flex items-center gap-2 rounded-2xl bg-muted/50 border border-border/40 px-4 py-2.5">
                    <audio src={audioDataUrl} controls className="flex-1 h-8 min-w-0" />
                    <button
                      onClick={() => setAudioDataUrl('')}
                      className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={[
                      'w-full flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition-colors',
                      isRecording
                        ? 'bg-destructive/10 border-destructive/30 text-destructive'
                        : 'bg-muted/50 border-border/40 text-muted-foreground/60 hover:text-muted-foreground/80',
                    ].join(' ')}
                  >
                    {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                    <span>
                      {isRecording
                        ? `Parar gravação • ${formatDuration(recordingDuration)}`
                        : 'Gravar áudio'}
                    </span>
                  </button>
                )}
              </div>

              <div className="pb-3" />
            </div>

            <div
              className="px-6 pt-3 border-t border-border/40 shrink-0"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <Button
                onClick={handleConfirm}
                className="w-full rounded-full h-12 text-sm font-medium"
              >
                Concluir registro
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default EmotionModal;
