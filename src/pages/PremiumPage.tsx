import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, BarChart2, Brain, Zap, Infinity } from 'lucide-react';

const FEATURES = [
  {
    icon: <BarChart2 size={18} className="text-primary" />,
    title: 'Análise emocional completa',
    description: 'Veja todas as suas emoções ranqueadas, com evolução ao longo do tempo.',
  },
  {
    icon: <Brain size={18} className="text-primary" />,
    title: 'Padrões e insights',
    description: 'Descubra quais situações disparam cada estado emocional no seu cotidiano.',
  },
  {
    icon: <Zap size={18} className="text-primary" />,
    title: 'Registros ilimitados',
    description: 'Sem limite diário. Registre quantas vezes precisar.',
  },
  {
    icon: <Infinity size={18} className="text-primary" />,
    title: 'Histórico completo',
    description: 'Acesse todo o seu histórico emocional sem restrições.',
  },
];

const PremiumPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-muted/30">

      {/* Back */}
      <div className="px-6 pt-10 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar
        </button>
      </div>

      {/* Aviso WIP */}
      <div className="mx-4 mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex gap-3 items-start">
        <span className="text-base shrink-0 mt-px">🚧</span>
        <div>
          <p className="text-[11px] font-bold text-amber-800 mb-0.5 uppercase tracking-wide">Funcionalidade provisória</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Esta página está sendo construída. Conteúdo, preços e funcionalidades vão mudar bastante.
            Não é a versão final.
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 pb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-5">
          <Lock size={26} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Pendly Premium</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
          Aprofunde seu autoconhecimento com análises completas do seu padrão emocional.
        </p>
      </div>

      {/* Features */}
      <div className="px-4 flex flex-col gap-3 mb-8">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3.5 rounded-2xl bg-card border border-border/30 px-4 py-3.5"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              {f.icon}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground mb-0.5">{f.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 flex flex-col gap-3">
        <button
          disabled
          className="w-full h-12 rounded-2xl bg-primary/40 text-white/70 font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
        >
          <Lock size={14} />
          Em breve
        </button>
        <p className="text-center text-[10px] text-muted-foreground/40">
          Preços e planos ainda sendo definidos
        </p>
      </div>

    </div>
  );
};

export default PremiumPage;
