import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import SupportModal from './SupportModal';

interface TrialWhatsAppButtonProps {
  installBannerVisible?: boolean;
}

export default function TrialWhatsAppButton({ installBannerVisible }: TrialWhatsAppButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  // Abre espaço acima do banner de instalação do app quando ele está visível.
  const rem = (isDesktop ? 1.5 : 5) + (installBannerVisible ? 5 : 0);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        title="Precisa de ajuda?"
        className="fixed right-4 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 cursor-pointer"
        style={{
          width: '52px',
          height: '52px',
          bottom: `calc(${rem}rem + env(safe-area-inset-bottom, 0px))`,
        }}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isModalOpen && <SupportModal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
