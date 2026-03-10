import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface NaoSeiFlowProps {
  onResult: (position: number) => void;
  onCancel: () => void;
}

const questions = [
  {
    text: 'Hoje você sente que nada depende de você, ou que tudo depende de você?',
    options: [
      { label: 'Nada depende de mim', value: -30 },
      { label: 'Pouca coisa depende de mim', value: -15 },
      { label: 'Um pouco de cada', value: 0 },
      { label: 'Muita coisa depende de mim', value: 15 },
      { label: 'Tudo depende de mim', value: 30 },
    ],
  },
  {
    text: 'Você está sendo muito duro consigo mesmo hoje?',
    options: [
      { label: 'Nem um pouco', value: -10 },
      { label: 'Um pouco', value: 5 },
      { label: 'Bastante', value: 15 },
      { label: 'Muito', value: 25 },
    ],
  },
];

const NaoSeiFlow = ({ onResult, onCancel }: NaoSeiFlowProps) => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const handleAnswer = (value: number) => {
    const newScore = score + value;
    if (step < questions.length - 1) {
      setScore(newScore);
      setStep(step + 1);
    } else {
      // Map score to 0-100 range, centered at 50
      const position = Math.max(0, Math.min(100, 50 + newScore));
      onResult(position);
    }
  };

  const q = questions[step];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl bg-background p-6 pb-[max(2rem,env(safe-area-inset-bottom))] shadow-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs text-muted-foreground font-medium">
            {step + 1} de {questions.length}
          </span>
          <button onClick={onCancel} className="text-xs text-muted-foreground">
            Fechar
          </button>
        </div>

        <p className="text-lg font-semibold text-foreground mb-6 leading-snug">
          {q.text}
        </p>

        <div className="flex flex-col gap-2.5">
          {q.options.map((opt) => (
            <Button
              key={opt.label}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3.5 px-4 text-sm font-normal rounded-xl border-border hover:bg-accent hover:text-accent-foreground"
              onClick={() => handleAnswer(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NaoSeiFlow;
