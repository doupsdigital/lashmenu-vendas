import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export type GuidedTourStep = 'negocio' | 'servicos' | 'link';

const STEP_ORDER: GuidedTourStep[] = ['negocio', 'servicos', 'link'];

const STEP_KEYS: Record<GuidedTourStep, string> = {
  negocio: 'tour_guiado_negocio',
  servicos: 'tour_guiado_servicos',
  link: 'tour_guiado_link',
};

const SKIP_KEY = 'tour_guiado_pulado';

// Contas criadas a partir daqui veem o checklist guiado sozinho na primeira
// visita. Contas anteriores (inclusive as "limpas" usadas pra teste) nunca
// disparam automaticamente — evita reabrir o onboarding pra quem já usa o
// sistema. Ver FORCE_KEY abaixo pra testar em qualquer conta sem mexer nisso.
const CUTOFF = new Date('2026-07-15T11:00:00Z');

// Override manual pra testar o fluxo em qualquer conta já logada, sem
// precisar cadastrar uma profissional nova nem tocar no banco de produção:
// no console do navegador (F12), rode
//   localStorage.setItem('lashhub-force-guided-tour', '1')
// e recarregue a página. Pra desligar de novo: localStorage.removeItem(...).
const FORCE_KEY = 'lashhub-force-guided-tour';

function isForced(): boolean {
  try {
    return localStorage.getItem(FORCE_KEY) === '1';
  } catch {
    return false;
  }
}

export function useGuidedTour() {
  const { profile, isPaginaVista, markPageSeen, loading, user, refreshProfile } = useAuth();

  // Helper de teste: zera só o progresso do checklist guiado (etapas +
  // "pulei") pra profissional logada, sem mexer no resto do
  // onboarding_paginas_vistas (tours antigos do driver.js continuam como
  // estavam). Disponível no console do navegador como:
  //   await lashhubResetGuidedTour()
  useEffect(() => {
    (window as unknown as Record<string, unknown>).lashhubResetGuidedTour = async () => {
      if (!user) {
        console.warn('[lashhubResetGuidedTour] Nenhum usuário logado.');
        return;
      }
      const current = profile?.onboarding_paginas_vistas ?? [];
      const allKeys: string[] = [...Object.values(STEP_KEYS), SKIP_KEY];
      const filtered = current.filter((k) => !allKeys.includes(k));
      await supabase.from('usuarios').update({ onboarding_paginas_vistas: filtered }).eq('id', user.id);
      await refreshProfile();
      console.log('[lashhubResetGuidedTour] Progresso do checklist guiado zerado.');
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).lashhubResetGuidedTour;
    };
  }, [user, profile, refreshProfile]);

  const forced = isForced();
  const isNewAccount = !!profile?.created_at && new Date(profile.created_at) >= CUTOFF;

  // "eligible" = essa conta faz parte do cohort do checklist guiado (mesmo
  // que já tenha terminado ou pulado). Usado também pra suspender os tours
  // automáticos antigos do driver.js nas telas cobertas pelo checklist.
  const eligible = forced || isNewAccount;

  const skipped = isPaginaVista(SKIP_KEY);

  const currentStep: GuidedTourStep | null =
    STEP_ORDER.find((step) => !isPaginaVista(STEP_KEYS[step])) ?? null;

  const stepIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : STEP_ORDER.length;

  const visible = !loading && eligible && !skipped && currentStep !== null;

  const completeStep = async (step: GuidedTourStep) => {
    await markPageSeen(STEP_KEYS[step]);
  };

  const skip = async () => {
    await markPageSeen(SKIP_KEY);
  };

  return {
    eligible,
    visible,
    currentStep,
    stepIndex,
    totalSteps: STEP_ORDER.length,
    completeStep,
    skip,
  };
}
