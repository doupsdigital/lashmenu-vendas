import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  bannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;
}

const InstallPromptContext = createContext<InstallPromptContextType>({
  deferredPrompt: null,
  triggerInstall: async () => 'unavailable',
  bannerVisible: false,
  setBannerVisible: () => {},
});

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Reflete se o InstallBanner flutuante (não-inline) está visível em qualquer tela,
  // para que layouts (Layout, PortalLayout) possam afastar botões fixos dele.
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  };

  return (
    <InstallPromptContext.Provider value={{ deferredPrompt, triggerInstall, bannerVisible, setBannerVisible }}>
      {children}
    </InstallPromptContext.Provider>
  );
}

export const useInstallPrompt = () => useContext(InstallPromptContext);
