import { useRef, useState } from 'react';

const CLOSE_THRESHOLD_PX = 90;

// Permite arrastar o "tracinho" do bottom sheet pra baixo pra fechá-lo.
// touchAction: 'none' no handle impede o navegador de interpretar o gesto
// como rolagem da página por trás (bug comum em overlays fixed no iOS Safari).
export function useSwipeToClose(onClose: () => void) {
  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };

  const onTouchEnd = () => {
    if (startY.current === null) return;
    if (dragY > CLOSE_THRESHOLD_PX) onClose();
    setDragY(0);
    setDragging(false);
    startY.current = null;
  };

  return {
    dragHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    sheetStyle: {
      transform: dragY ? `translateY(${dragY}px)` : undefined,
      transition: dragging ? 'none' : undefined,
    },
  };
}
