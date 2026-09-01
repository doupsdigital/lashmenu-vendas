import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import posthog from 'posthog-js';

// PostHog não sabe sozinho quando a rota muda numa SPA (sem reload de página),
// por isso disparamos o $pageview manualmente a cada troca de rota.
// Não rastreamos o Portal do Cliente (/portal/...): só a profissional é
// rastreada, nunca a cliente final (ver docs/plano_analytics_funil_uso.md, Fase 5).
export default function PostHogPageview() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/portal/')) return;
    posthog.capture('$pageview');
  }, [pathname]);

  return null;
}
