import { useLocation } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useOnboarding, type OnboardingPageKey } from '../../hooks/useOnboarding';
import { useGuidedTour } from '../../hooks/useGuidedTour';

function getPageKey(pathname: string): OnboardingPageKey | null {
  if (pathname === '/meu-estudio') return 'meu_estudio';
  if (pathname.startsWith('/agendamentos')) return 'agendamentos';
  if (pathname.startsWith('/clientes')) return 'clientes';
  if (pathname.startsWith('/servicos')) return 'servicos';
  if (pathname === '/meus-horarios') return 'meus_horarios';
  if (pathname === '/relatorios') return 'relatorios';
  if (pathname === '/link-agendamento') return 'link_agendamento';
  if (pathname === '/configuracoes') return 'configuracoes';
  return null;
}

interface HelpButtonInnerProps {
  pageKey: OnboardingPageKey;
  whatsAppVisible?: boolean;
  installBannerVisible?: boolean;
  behindChecklistBanner?: boolean;
}

function HelpButtonInner({ pageKey, whatsAppVisible, installBannerVisible, behindChecklistBanner }: HelpButtonInnerProps) {
  const { startTour } = useOnboarding(pageKey);
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  // Empilha os deslocamentos: abre espaço para o botão de WhatsApp do trial
  // e, por cima disso, para o banner de instalação do app quando ambos aparecem.
  let rem = isDesktop ? 1.5 : 5;
  if (whatsAppVisible) rem += isDesktop ? 4.5 : 4;
  if (installBannerVisible) rem += 5;
  const bottom = `calc(${rem}rem + env(safe-area-inset-bottom, 0px))`;
  return (
    <button
      onClick={startTour}
      title="Ajuda — ver tutorial desta tela"
      // z-40 (abaixo do banner do checklist guiado, z-[45]) enquanto ele
      // estiver visível na tela — evita o botão brigando por cima do banner
      // no canto onde os dois se encostam.
      className={`fixed right-4 flex items-center gap-1.5 px-3 py-2 bg-white border border-border rounded-full shadow-md text-text-secondary hover:text-rose-600 hover:border-rose-300 text-xs font-medium transition-all hover:shadow-lg cursor-pointer ${behindChecklistBanner ? 'z-40' : 'z-50'}`}
      style={{ bottom }}
    >
      <HelpCircle className="w-4 h-4" />
      <span>Ajuda</span>
    </button>
  );
}

interface FloatingHelpButtonProps {
  whatsAppVisible?: boolean;
  installBannerVisible?: boolean;
}

export default function FloatingHelpButton({ whatsAppVisible, installBannerVisible }: FloatingHelpButtonProps) {
  const { pathname } = useLocation();
  const pageKey = getPageKey(pathname);
  const { visible: guidedTourVisible, currentStep } = useGuidedTour();
  if (!pageKey) return null;
  // Mesma condição de rota+etapa usada pelo CompactBanner do checklist
  // guiado (GuidedTourSheet.tsx) — não precisa saber se ele está de fato
  // renderizado (dispensado/dicas abertas): z-index mais baixo não causa
  // nenhum efeito colateral quando não há nada nessa faixa de z pra baixo dele.
  const behindChecklistBanner =
    guidedTourVisible &&
    ((pathname === '/configuracoes' && currentStep === 'negocio') ||
      (pathname === '/servicos' && currentStep === 'servicos'));
  return (
    <HelpButtonInner
      pageKey={pageKey}
      whatsAppVisible={whatsAppVisible}
      installBannerVisible={installBannerVisible}
      behindChecklistBanner={behindChecklistBanner}
    />
  );
}
