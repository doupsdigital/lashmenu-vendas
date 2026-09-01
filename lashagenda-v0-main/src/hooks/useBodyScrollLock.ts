import { useEffect } from 'react';

// Trava o scroll do body enquanto um bottom sheet/modal está aberto.
// Sem isso, no iOS Safari a página por trás continua rolando por baixo
// do overlay fixed durante gestos de toque.
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);
}
