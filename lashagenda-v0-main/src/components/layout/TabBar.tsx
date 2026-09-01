import { NavLink } from 'react-router-dom';
import { Home, Users, WandSparkles, Settings, CalendarCheck } from 'lucide-react';

const sideTabsLeft = [
  { label: 'Início', icon: Home, to: '/meu-estudio' },
  { label: 'Clientes', icon: Users, to: '/clientes' },
];

const sideTabsRight = [
  { label: 'Serviços', icon: WandSparkles, to: '/servicos' },
  { label: 'Config', icon: Settings, to: '/configuracoes' },
];

export default function TabBar() {
  return (
    <nav
      id="onboarding-tabbar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative flex items-stretch h-[68px]">
        {sideTabsLeft.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors
              ${isActive ? 'text-rose-600' : 'text-text-muted hover:text-text-secondary'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Espaço reservado para o botão central flutuante */}
        <div className="flex-1" />

        {sideTabsRight.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors
              ${isActive ? 'text-rose-600' : 'text-text-muted hover:text-text-secondary'}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Botão central em destaque — Agenda */}
        <NavLink
          to="/agendamentos"
          className={({ isActive }) =>
            `absolute left-1/2 -translate-x-1/2 -top-6 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-600/30 border-4 border-white transition-colors
            ${isActive ? 'bg-rose-700' : 'bg-rose-600'}`
          }
        >
          <CalendarCheck className="w-7 h-7" />
        </NavLink>
      </div>
    </nav>
  );
}
