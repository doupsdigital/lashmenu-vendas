import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, WandSparkles, Link2, Copy, Check, X, Lightbulb } from 'lucide-react';
import posthog from 'posthog-js';
import { useAuth } from '../../contexts/AuthContext';
import { useGuidedTour, type GuidedTourStep } from '../../hooks/useGuidedTour';
import { getFieldTipsActive, subscribeFieldTipsActive } from '../../hooks/guidedTourFieldTipsStore';

interface StepMeta {
  numero: number;
  Icon: React.ComponentType<{ className?: string }>;
  corIcone: string;
  corBg: string;
  corBotao: string;
  titulo: string;
  descricao: string;
  rota: string;
  ctaLabel: string;
  bannerPergunta: string;
  bannerBotao: string;
}

const STEP_META: Record<GuidedTourStep, StepMeta> = {
  negocio: {
    numero: 1,
    Icon: Building2,
    corIcone: 'text-rose-600',
    corBg: 'bg-rose-100',
    corBotao: 'bg-rose-600 hover:bg-rose-800',
    titulo: 'Configure os dados do seu negócio',
    descricao: 'Nome, descrição, Instagram e endereço — tudo isso aparece no seu portal.',
    rota: '/configuracoes',
    ctaLabel: 'Ir para Configurações',
    bannerPergunta: 'Terminou de configurar os dados do negócio?',
    bannerBotao: 'Concluí essa etapa',
  },
  servicos: {
    numero: 2,
    Icon: WandSparkles,
    corIcone: 'text-amber-600',
    corBg: 'bg-amber-100',
    corBotao: 'bg-amber-600 hover:bg-amber-700',
    titulo: 'Cadastre seus serviços',
    descricao: 'Você já tem 2 serviços prontos. Edite os preços e durações, ou cadastre os seus.',
    rota: '/servicos',
    ctaLabel: 'Ir para Serviços',
    bannerPergunta: 'Terminou de cadastrar os serviços?',
    bannerBotao: 'Cadastrei os serviços',
  },
  link: {
    numero: 3,
    Icon: Link2,
    corIcone: 'text-green-600',
    corBg: 'bg-green-100',
    corBotao: 'bg-green-600 hover:bg-green-700',
    titulo: 'Compartilhe seu link de atendimento',
    descricao: 'Envie esse link pras suas clientes agendarem sozinhas, a qualquer hora.',
    rota: '/meu-estudio',
    ctaLabel: '',
    bannerPergunta: '',
    bannerBotao: '',
  },
};

function ProgressHeader({ stepIndex, totalSteps, onClose }: { stepIndex: number; totalSteps: number; onClose: () => void }) {
  const percent = Math.round(((stepIndex + 1) / totalSteps) * 100);
  return (
    <div>
      <div className="flex items-start justify-between gap-3 px-6 pt-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-rose-600">Tutorial guiado</p>
          <h3 className="font-title font-bold text-2xl text-text-primary mt-1">Vamos configurar seu atendimento</h3>
          <p className="text-sm text-text-secondary mt-1">3 passos rápidos pra começar a receber clientes.</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Pular tutorial"
          className="text-text-muted hover:text-text-secondary flex-shrink-0 p-1 -mt-1 -mr-1 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="px-6 mt-5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
          <span>Etapa {stepIndex + 1} de {totalSteps}</span>
          <span className="text-rose-600">{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-rose-100 overflow-hidden">
          <div className="h-full bg-rose-600 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>
    </div>
  );
}

function FullSheet({ step, stepIndex, totalSteps, skip, completeStep }: {
  step: GuidedTourStep;
  stepIndex: number;
  totalSteps: number;
  skip: () => void;
  completeStep: (s: GuidedTourStep) => void;
}) {
  const navigate = useNavigate();
  const { estabelecimentoSlug } = useAuth();
  const [linkCopied, setLinkCopied] = useState(false);
  const meta = STEP_META[step];

  const portalUrl = estabelecimentoSlug ? `${window.location.origin}/portal/${estabelecimentoSlug}` : '';

  const handleCopyLink = async () => {
    if (!portalUrl) return;
    posthog.capture('link_agendamento_copiado');
    try {
      await navigator.clipboard.writeText(portalUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = portalUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <>
      {/* Dá foco no tutorial borrando o fundo — some junto com o sheet assim
          que a profissional navega pra agir (preencher formulário, etc.). */}
      <div className="fixed inset-0 z-[105] bg-black/30 backdrop-blur-sm pointer-events-none" />

      <div className="fixed inset-x-0 bottom-0 z-[110] animate-slide-up">
        <div
          className="mx-auto max-w-lg bg-rose-50 border border-rose-200 shadow-2xl rounded-t-[28px] pb-6"
          style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <ProgressHeader stepIndex={stepIndex} totalSteps={totalSteps} onClose={skip} />

          <div className="px-6 mt-5">
            <div className="rounded-2xl border border-rose-100 bg-white p-6">
              <div className={`w-14 h-14 rounded-2xl ${meta.corBg} flex items-center justify-center mb-4`}>
                <meta.Icon className={`w-7 h-7 ${meta.corIcone}`} />
              </div>
              <h4 className="font-title font-bold text-xl text-text-primary">{meta.numero}. {meta.titulo}</h4>
              <p className="text-base text-text-secondary mt-2 leading-relaxed">{meta.descricao}</p>

              {step === 'link' ? (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 bg-white border border-border rounded-full px-4 py-3">
                    <span className="text-sm text-text-secondary truncate flex-1">{portalUrl || 'Carregando...'}</span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    disabled={!portalUrl}
                    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-full text-base font-bold transition-all cursor-pointer disabled:opacity-50 ${meta.corBotao}`}
                  >
                    {linkCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {linkCopied ? 'Link copiado!' : 'Copiar link agora'}
                  </button>

                  <div className="flex items-start gap-2 bg-green-50 border border-green-100 rounded-2xl p-3.5">
                    <Lightbulb className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800 leading-relaxed">
                      Esse link também está sempre aqui na tela inicial, no card "Compartilhe sua Agenda".
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => navigate(meta.rota, { state: { fromGuidedTour: true } })}
                  className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 text-white rounded-full text-base font-bold transition-all cursor-pointer ${meta.corBotao}`}
                >
                  {meta.ctaLabel}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-6 mt-5">
            <button onClick={skip} className="text-sm font-semibold text-text-muted hover:text-text-secondary cursor-pointer">
              Pular tutorial
            </button>
            {step === 'link' && (
              <button
                onClick={() => completeStep('link')}
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-800 text-white rounded-full text-base font-bold transition-all cursor-pointer"
              >
                Concluir tutorial 🎉
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CompactBanner({ step, completeStep }: { step: GuidedTourStep; completeStep: (s: GuidedTourStep) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(false), [location.pathname]);
  const fieldTipsActive = useSyncExternalStore(subscribeFieldTipsActive, getFieldTipsActive);

  const meta = STEP_META[step];
  // Enquanto as dicas de campo (driver.js) estão abertas, o banner some pra
  // não brigar visualmente com elas — volta a aparecer quando o usuário
  // termina ou fecha as dicas.
  if (dismissed || fieldTipsActive) return null;

  const handleComplete = async () => {
    await completeStep(step);
    navigate('/meu-estudio');
  };

  return (
    <div
      className="fixed inset-x-0 z-[45] bottom-[84px] md:bottom-6 px-4 animate-slide-up"
    >
      <div className="mx-auto max-w-lg shadow-2xl rounded-[24px] px-6 py-5 bg-amber-50 border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <meta.Icon className="w-6 h-6 text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold uppercase tracking-wider text-amber-700">Tutorial guiado</p>
            <p className="text-lg font-bold text-amber-900 mt-0.5 leading-snug">{meta.bannerPergunta}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-4 flex-wrap">
          <button
            onClick={() => setDismissed(true)}
            className="text-sm font-semibold text-amber-800 hover:text-amber-900 hover:underline underline-offset-2 transition-all cursor-pointer"
          >
            Fazer depois
          </button>
          <button
            onClick={handleComplete}
            className="px-5 py-2.5 bg-amber-600 text-white hover:bg-amber-700 rounded-full text-sm font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            {meta.bannerBotao}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuidedTourSheet() {
  const location = useLocation();
  const { visible, currentStep, stepIndex, totalSteps, skip, completeStep } = useGuidedTour();

  if (!visible || !currentStep) return null;

  if (location.pathname === '/meu-estudio') {
    return (
      <FullSheet
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        skip={skip}
        completeStep={completeStep}
      />
    );
  }

  if (location.pathname === '/configuracoes' && currentStep === 'negocio') {
    return <CompactBanner step="negocio" completeStep={completeStep} />;
  }

  if (location.pathname === '/servicos' && currentStep === 'servicos') {
    return <CompactBanner step="servicos" completeStep={completeStep} />;
  }

  return null;
}
