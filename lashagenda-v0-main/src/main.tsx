import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import posthog from 'posthog-js'
import './index.css'
import App from './App.tsx'

// O Portal do Cliente (/portal/...) nunca deve ser rastreado — nem eventos,
// nem gravação de sessão, nem cookies do PostHog (ver Fase 5 do plano de
// analytics). Os links para o portal sempre abrem em nova aba
// (target="_blank", ver LinkAgendamento.tsx), então essa checagem no
// carregamento inicial da página cobre 100% dos casos reais.
if (!window.location.pathname.startsWith('/portal/')) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    capture_pageview: false, // SPA: disparado manualmente a cada troca de rota (ver App.tsx)
    session_recording: {
      maskAllInputs: false, // mascaramento seletivo de dados de clientes, ver Fase 5
    },
  });
}

// Registra o service worker para habilitar instalação como PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// iOS Safari: força repaint após resize/rotação para corrigir padding-top
// que não é renderizado corretamente na primeira pintura visual.
if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
  const repaint = () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 1);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    });
  };

  // Após rotação de tela (aguarda o browser concluir o resize)
  window.addEventListener('orientationchange', () => setTimeout(repaint, 100));

  // Ao voltar ao app (após sair para outra janela)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) repaint();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
