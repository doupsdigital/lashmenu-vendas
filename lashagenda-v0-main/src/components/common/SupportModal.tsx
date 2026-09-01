import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface SupportModalProps {
  onClose: () => void;
}

const SUPPORT_PHONE = '5562991083435';
const SUPPORT_MESSAGE = 'Olá, preciso de ajuda.';

export default function SupportModal({ onClose }: SupportModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useBodyScrollLock(true);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 250);
  };

  const { dragHandlers, sheetStyle } = useSwipeToClose(handleClose);

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(SUPPORT_MESSAGE)}`;
    window.open(url, '_blank');
    handleClose();
  };

  return (
    <Modal>
      <div
        className={`fixed inset-0 z-[300] flex items-end justify-center bg-black/45 backdrop-blur-sm transition-opacity duration-250 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl px-6 pt-3 transition-transform duration-250 ease-out ${show ? 'translate-y-0' : 'translate-y-full'}`}
          style={{
            paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom, 0px))',
            ...sheetStyle,
          }}
        >
          {/* Drag handle — arraste pra baixo pra fechar */}
          <div
            className="pb-1 -mt-1 -mx-6 px-6 flex justify-center"
            style={{ touchAction: 'none' }}
            {...dragHandlers}
          >
            <div className="w-10 h-1.5 bg-border rounded-full my-3" />
          </div>

          <div className="flex flex-col items-center text-center gap-1 mb-5 pt-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center mb-2 overflow-hidden">
              <img src="/logo-login.png" alt="Lash Agenda" className="w-full h-full object-contain" />
            </div>
            <h3 className="font-title font-bold text-lg text-text-primary">Precisa de ajuda?</h3>
            <p className="text-sm text-text-secondary">Nossa equipe responde rápido pelo WhatsApp</p>
          </div>

          <div className="flex flex-col gap-2 pb-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl shadow-md shadow-green-100 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              Abrir WhatsApp
            </button>
            <button
              onClick={handleClose}
              className="w-full text-center text-sm font-medium text-text-secondary hover:text-text-primary bg-bg hover:bg-border/40 rounded-2xl py-2.5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
