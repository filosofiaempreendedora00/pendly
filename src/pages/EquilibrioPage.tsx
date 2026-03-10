import { useState, useRef, useEffect } from 'react';
import { getEntriesForDate, getTodayKey, getAveragePosition, getDailyIntervention } from '@/lib/pendulum';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, Leaf, Mic, Square, Play, Pause, RotateCcw } from 'lucide-react';

type OutroMode = 'text' | 'audio';

const EquilibrioPage = () => {
  const [position, setPosition] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [outroMode, setOutroMode] = useState<OutroMode>('text');
  const [outroText, setOutroText] = useState('');
  const [outroRecorded, setOutroRecorded] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Audio recording state
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const todayEntries = getEntriesForDate(getTodayKey());
    if (todayEntries.length > 0) {
      setPosition(getAveragePosition(todayEntries));
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('recorded');
        setOutroRecorded(true);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecordingState('recording');
    } catch { /* mic denied */ }
  };

  const stopRecording = () => mediaRecorderRef.current?.stop();

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingState('idle');
    setIsPlaying(false);
    setOutroRecorded(false);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  if (position === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-24 px-6 text-center">
        <Leaf size={40} className="text-primary/40 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Registre seu pêndulo primeiro</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Vá até a tela Pêndulo e registre como você está se sentindo hoje.
        </p>
      </div>
    );
  }

  const intervention = getDailyIntervention(position);
  const canConclude =
    selectedOption !== null &&
    (selectedOption !== 'outro' ||
      (outroMode === 'text' ? outroText.trim().length > 0 : outroRecorded));

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-24 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-5">
          <Check size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Bom trabalho</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Pequenos momentos de reflexão fazem diferença. Volte amanhã.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 px-6 pt-14 pb-36 overflow-y-auto">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        {/* Step 0: Reflection + Question */}
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <p className="text-[1.1rem] font-medium text-foreground leading-relaxed">
              {intervention.reflection}
            </p>
            <p className="text-[1.05rem] text-foreground/75 leading-relaxed">
              {intervention.question}
            </p>
          </div>
        )}

        {/* Step 1: Options */}
        {step === 1 && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Escolha o que mais se aproxima:
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(0)}
                className="text-xs text-muted-foreground hover:text-foreground -mr-2"
              >
                ← Voltar
              </Button>
            </div>
            {intervention.options.map((opt) => (
              <Button
                key={opt}
                variant={selectedOption === opt ? 'default' : 'outline'}
                className={`w-full justify-start text-left h-auto py-3.5 px-4 text-sm font-normal rounded-xl whitespace-normal ${
                  selectedOption === opt ? '' : 'border-border'
                }`}
                onClick={() => setSelectedOption(opt)}
              >
                {opt}
              </Button>
            ))}

            {/* Outro option */}
            <Button
              variant={selectedOption === 'outro' ? 'default' : 'outline'}
              className={`w-full justify-start text-left h-auto py-3.5 px-4 text-sm font-normal rounded-xl whitespace-normal mt-1 ${
                selectedOption === 'outro' ? '' : 'border-dashed border-border'
              }`}
              onClick={() => setSelectedOption('outro')}
            >
              ✏️ Outro — quero responder do meu jeito
            </Button>

            {/* Outro expanded */}
            {selectedOption === 'outro' && (
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-muted/20 mt-1">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setOutroMode('text')}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      outroMode === 'text'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Texto
                  </button>
                  <button
                    onClick={() => setOutroMode('audio')}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      outroMode === 'audio'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Áudio
                  </button>
                </div>

                {outroMode === 'text' && (
                  <Textarea
                    placeholder="Escreva sua resposta..."
                    value={outroText}
                    onChange={(e) => setOutroText(e.target.value)}
                    className="rounded-xl border-border resize-none text-sm min-h-[80px]"
                    autoFocus
                  />
                )}

                {outroMode === 'audio' && (
                  <div className="flex flex-col items-center gap-3 py-2 min-h-[80px] justify-center">
                    {recordingState === 'idle' && (
                      <Button variant="outline" onClick={startRecording} className="gap-2 rounded-full">
                        <Mic size={15} /> Começar a gravar
                      </Button>
                    )}
                    {recordingState === 'recording' && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-end gap-1 h-8">
                          {[3, 5, 4, 7, 3, 6, 4, 5, 3].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 rounded-full bg-primary animate-bounce"
                              style={{ height: `${h * 4}px`, animationDelay: `${i * 80}ms`, animationDuration: '500ms' }}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">Gravando...</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={stopRecording}
                          className="gap-2 rounded-full border-destructive text-destructive hover:bg-destructive/10"
                        >
                          <Square size={12} fill="currentColor" /> Parar
                        </Button>
                      </div>
                    )}
                    {recordingState === 'recorded' && audioUrl && (
                      <div className="flex items-center gap-3 w-full">
                        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                        <Button variant="outline" size="icon" onClick={togglePlay} className="rounded-full h-9 w-9 shrink-0">
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </Button>
                        <span className="text-sm text-foreground flex-1">Áudio gravado ✓</span>
                        <Button variant="ghost" size="icon" onClick={resetRecording} className="h-8 w-8 text-muted-foreground">
                          <RotateCcw size={13} />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed CTA button above bottom nav */}
      <div className="fixed left-0 right-0 bottom-20 z-40 px-6 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <Button
            onClick={() => { if (step === 0) setStep(1); else setCompleted(true); }}
            disabled={step === 1 && !canConclude}
            className="w-full rounded-full h-12 text-sm font-medium shadow-sm transition-all duration-300 transform translate-y-0"
            style={{
              boxShadow: '0 -10px 40px -10px hsl(var(--background)), 0 4px 15px -3px hsl(var(--primary) / 0.2)'
            }}
          >
            {step === 0 ? 'Continuar' : <><Check size={15} className="mr-1" /> Concluir</>}
          </Button>
        </div>
      </div>
      
      {/* Background gradient fade for bottom */}
      <div className="fixed left-0 right-0 bottom-[60px] h-24 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none z-30" />
    </div>
  );
};

export default EquilibrioPage;
