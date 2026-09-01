import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Calendar, ClipboardList, User, LogOut, MessageCircle, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePortal } from '../../contexts/PortalContext';
import PortalFloatingHelpButton from '../common/PortalFloatingHelpButton';
import InstallBanner from '../common/InstallBanner';

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isProfissional, signOut } = useAuth();
  const { nomeNegocio, logoUrl, slug, loading, nomeProfissional, telefoneProfissional } = usePortal();
  const isAgendar = location.pathname.endsWith('/agendar');
  // O convite de instalação só pode aparecer aqui: sem start_url no manifest,
  // o iOS usa a página atual como ponto de partida do ícone instalado — essa
  // é a única rota preparada pra recuperar a sessão se ela não sobreviver à
  // instalação (ver PortalEntrarApp). Em qualquer outra tela, instalar a
  // partir dali arriscaria abrir o app sem sessão e sem como se recuperar.
  const isAppToken = location.pathname.includes('/app/');

  const [installBannerVisible, setInstallBannerVisible] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate(`/portal/${slug}/catalogo`, { replace: true });
  };

  const clientName = profile?.nome?.split(' ')[0] || 'Cliente';
  const initials = (profile?.nome || 'Cliente')
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const profissionalInitials = (nomeProfissional || nomeNegocio || 'Studio')
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navItems = [
    { name: 'Catálogo', shortName: 'Catálogo', path: `/portal/${slug}/catalogo`, icon: BookOpen },
    // Agendar é público — permite agendamento como convidada, sem precisar de login.
    { name: 'Agendar', shortName: 'Agendar', path: `/portal/${slug}/agendar`, icon: Calendar },
    ...(user ? [
      { name: 'Meus Agendamentos', shortName: 'Agendamentos', path: `/portal/${slug}/meus-agendamentos`, icon: ClipboardList },
      { name: 'Meu Perfil', shortName: 'Perfil', path: `/portal/${slug}/perfil`, icon: User },
    ] : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <img src="/icon-192.png" alt="Lash Agenda" className="w-16 h-16 rounded-2xl shadow-md" />
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans">
      {/* Header */}
      <header className="h-[60px] bg-white border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={nomeNegocio || 'Studio'} className="h-8 w-auto object-contain flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-title font-semibold text-sm flex-shrink-0">
              {profissionalInitials}
            </div>
          )}
          <span className="text-sm font-semibold italic text-text-secondary tracking-wide uppercase truncate">
            {nomeNegocio}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Profissional visualizando o próprio portal: botão de retorno ao painel */}
          {isProfissional ? (
            <button
              onClick={() => navigate('/meu-estudio')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-800 rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel</span>
            </button>
          ) : user && (
            <>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={clientName}
                  className="w-9 h-9 rounded-full object-cover border border-rose-200 flex-shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {initials}
                </div>
              )}
              <span className="text-sm text-text-secondary">
                Olá, <span className="font-semibold text-text-primary">{clientName}</span>
              </span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-secondary hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sair</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Horizontal nav (desktop) */}
      <nav id="ob-portal-nav-desktop" className="hidden md:flex bg-white border-b border-border px-6 gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                isActive
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-text-secondary hover:text-rose-600 hover:border-rose-200'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 md:pb-8 max-w-[1200px] w-full mx-auto" style={{ paddingBottom: 'calc(1rem + 60px + env(safe-area-inset-bottom, 0px))' }}>
        <Outlet />
      </main>

      {user && isAppToken && <InstallBanner onVisibilityChange={setInstallBannerVisible} />}

      {/* Bottom nav (mobile) */}
      <nav
        id="ob-portal-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-[60px]">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-rose-600' : 'text-text-muted hover:text-rose-400'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.shortName}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Botão de ajuda flutuante do portal */}
      <PortalFloatingHelpButton bannerVisible={installBannerVisible} />

      {/* Botão flutuante de WhatsApp */}
      {!isAgendar && telefoneProfissional && (
        <a
          href={`https://wa.me/55${telefoneProfissional.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vi seu catálogo e gostaria de mais informações.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed right-4 z-40 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 md:bottom-6"
          title="Falar no WhatsApp"
          style={{
            width: '52px',
            height: '52px',
            bottom: installBannerVisible
              ? 'calc(9rem + env(safe-area-inset-bottom, 0px))'
              : 'calc(5rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <MessageCircle className="w-6 h-6" />
        </a>
      )}
    </div>
  );
}
