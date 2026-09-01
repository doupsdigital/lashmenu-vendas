import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Reseta o scroll ao topo a cada troca de rota, já que o React Router
// não faz isso automaticamente (navegação client-side preserva o scroll).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
