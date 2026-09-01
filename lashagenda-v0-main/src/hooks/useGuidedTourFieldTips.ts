import { useEffect, useRef } from 'react';
import { driver } from 'driver.js';
import type { DriveStep } from 'driver.js';
import { useAuth } from '../contexts/AuthContext';
import { useGuidedTour, type GuidedTourStep } from './useGuidedTour';
import { setFieldTipsActive } from './guidedTourFieldTipsStore';

// Tooltips de campo que complementam o checklist guiado — conteúdo próprio,
// independente dos tours do botão Ajuda (useOnboarding). Só dispara sozinho
// enquanto a etapa correspondente do checklist está ativa nessa tela, e uma
// única vez por conta (marca "visto" do mesmo jeito que o resto do onboarding).
export function useGuidedTourFieldTips(pageStep: GuidedTourStep, steps: DriveStep[]) {
  const { currentStep } = useGuidedTour();
  const { isPaginaVista, markPageSeen } = useAuth();
  const startedRef = useRef(false);
  const seenKey = `tour_guiado_dicas_${pageStep}`;

  // `steps` pode depender de dado assíncrono (ex: lista de serviços ainda
  // carregando) — lemos sempre o valor mais recente via ref dentro do
  // setTimeout, em vez do valor "congelado" na render em que o efeito rodou.
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  });

  useEffect(() => {
    if (currentStep !== pageStep) return;
    if (isPaginaVista(seenKey)) return;
    if (startedRef.current) return;

    // Marca "ativo" já aqui, assim que sabemos que as dicas vão abrir nessa
    // página — não só quando o driver.js de fato dispara lá na frente (depois
    // do setTimeout + espera pelo elemento no DOM). Sem isso, o banner do
    // checklist pisca na tela nessa janela inicial antes das dicas abrirem.
    setFieldTipsActive(true);

    let cancelled = false;
    let attempts = 0;
    let driverStarted = false;

    const start = () => {
      if (cancelled) return;
      driverStarted = true;
      startedRef.current = true;
      const driverObj = driver({
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayOpacity: 0.5,
        stagePadding: 6,
        stageRadius: 12,
        showProgress: true,
        progressText: '{{current}}/{{total}}',
        popoverClass: 'lashhub-onboarding-popover',
        nextBtnText: 'Próximo →',
        prevBtnText: '← Anterior',
        doneBtnText: 'Entendi ✓',
        onDestroyed: () => {
          setFieldTipsActive(false);
          markPageSeen(seenKey);
        },
        steps: stepsRef.current,
      } as Parameters<typeof driver>[0]);
      driverObj.drive();
    };

    // O card com os campos pode abrir/rolar até a tela via outro efeito da
    // própria página — em vez de um delay fixo (frágil), fica tentando até
    // o primeiro elemento do roteiro existir de fato no DOM (até ~3s).
    const waitForFirstElement = () => {
      if (cancelled) return;
      const first = stepsRef.current[0];
      const selector = typeof first?.element === 'string' ? first.element : null;
      const ready = !selector || !!document.querySelector(selector);
      if (ready || attempts >= 20) {
        start();
        return;
      }
      attempts += 1;
      setTimeout(waitForFirstElement, 150);
    };

    const t = setTimeout(waitForFirstElement, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
      // Efeito descartado antes do tour realmente abrir — acontece sempre
      // no StrictMode do React em desenvolvimento, que monta/desmonta/monta
      // de novo cada efeito de propósito. Libera a trava pra tentativa real.
      if (!driverStarted) startedRef.current = false;
      // Cobre tanto o cancelamento acima (StrictMode remonta e marca de novo
      // logo em seguida) quanto navegar embora com o tour ainda aberto — sem
      // isso o banner do checklist ficaria escondido pra sempre.
      setFieldTipsActive(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);
}
