import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import { applyPalette } from './utils/theme';
import ProfissionalRoute from './components/common/ProfissionalRoute';
import ClienteRoute from './components/common/ClienteRoute';
import Layout from './components/layout/Layout';
import PortalLayout from './components/layout/PortalLayout';
import ScrollToTop from './components/common/ScrollToTop';
import PostHogPageview from './components/common/PostHogPageview';
import Login from './pages/profissional/Login';
import Dashboard from './pages/profissional/Dashboard';
import Clientes from './pages/profissional/Clientes';
import PerfilCliente from './pages/profissional/PerfilCliente';
import Servicos from './pages/profissional/Servicos';
import Agendamentos from './pages/profissional/Agendamentos';
import Configuracoes from './pages/profissional/Configuracoes';
import LinkAgendamento from './pages/profissional/LinkAgendamento';
import MeusHorarios from './pages/profissional/MeusHorarios';
import CadastroProfissional from './pages/profissional/CadastroProfissional';
import PortalCatalogo from './pages/portal-clientes/PortalCatalogo';
import PortalAgendar from './pages/portal-clientes/PortalAgendar';
import PortalEntrarApp from './pages/portal-clientes/PortalEntrarApp';
import PortalMeusAgendamentos from './pages/portal-clientes/PortalMeusAgendamentos';
import PortalPerfil from './pages/portal-clientes/PortalPerfil';
import { PortalProvider } from './contexts/PortalContext';
import RecuperarSenha from './pages/profissional/RecuperarSenha';
import RedefinirSenha from './pages/profissional/RedefinirSenha';
import LandingPage_v5 from './pages/LandingPage_v5';
import LandingPage_v6 from './pages/LandingPage_v6';
import LandingPage_OfertaUm from './pages/LandingPage_OfertaUm';
import LandingPage_OfertaUm_Dark from './pages/LandingPage_OfertaUm_Dark';
import LandingPage_OfertaDois from './pages/LandingPage_OfertaDois';
import LandingPage_OfertaDois_Dark from './pages/LandingPage_OfertaDois_Dark';
import Tutoriais from './pages/profissional/Tutoriais';
import PoliticaPrivacidade from './pages/PoliticaPrivacidade';


import PlanGuard from './components/common/PlanGuard';
import BillingGuard from './components/common/BillingGuard';
import Faturamento from './pages/profissional/Faturamento';
import Relatorios from './pages/profissional/Relatorios';
import FichasAnamnese from './pages/profissional/FichasAnamnese';
import FichaAnamneseDetalhe from './pages/profissional/FichaAnamneseDetalhe';
import { InstallPromptProvider } from './contexts/InstallPromptContext';

export default function App() {
  useEffect(() => {
    // 1. Aplica o tema salvo localmente de forma imediata (carregamento rápido)
    const cachedPalette = localStorage.getItem('app_theme_palette') || 'pink_classico';
    const cachedDarkMode = localStorage.getItem('app_theme_dark_mode') === 'true';
    applyPalette(cachedPalette, cachedDarkMode);

    // 2. Consulta o banco para manter o tema atualizado de forma isolada por tenant
    async function fetchTheme() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        // Buscar estabelecimento_id do usuário logado
        const { data: profile } = await supabase
          .from('usuarios')
          .select('estabelecimento_id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.estabelecimento_id) {
          const { data, error } = await supabase
            .from('configuracao_negocio')
            .select('paleta_cores, modo_escuro')
            .eq('estabelecimento_id', profile.estabelecimento_id)
            .maybeSingle();

          if (!error && data) {
            const dbPalette = data.paleta_cores || 'pink_classico';
            const dbDarkMode = data.modo_escuro ?? false;
            applyPalette(dbPalette, dbDarkMode);

            // Sincronizar cache local para a próxima inicialização rápida
            localStorage.setItem('app_theme_palette', dbPalette);
            localStorage.setItem('app_theme_dark_mode', String(dbDarkMode));
          }
        }
      } catch (err) {
        console.error('Erro ao sincronizar tema:', err);
      }
    }
    fetchTheme();
  }, []);

  return (
    <InstallPromptProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <PostHogPageview />
          <Routes>
            {/* Públicas */}
            <Route path="/v5" element={<LandingPage_v5 />} />
            <Route path="/v6" element={<LandingPage_v6 />} />
            <Route path="/oferta1" element={<LandingPage_OfertaUm />} />
            <Route path="/oferta1-dark" element={<LandingPage_OfertaUm_Dark />} />
            <Route path="/oferta2" element={<LandingPage_OfertaDois />} />
            <Route path="/oferta2-dark" element={<LandingPage_OfertaDois_Dark />} />
            {/* Landing page de marketing/divulgação (bio do Instagram, etc.).
                A "/" é só do sistema (protegida por ProfissionalRoute). */}
            <Route path="/lp" element={<LandingPage_OfertaUm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<CadastroProfissional />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />

            {/* Rotas da profissional */}
            <Route
              path="/"
              element={
                <ProfissionalRoute>
                  <Layout />
                </ProfissionalRoute>
              }
            >
              {/* "/" sem rota específica (ex: PWA reaberto) cai direto no painel */}
              <Route index element={<Navigate to="/meu-estudio" replace />} />

              {/* Páginas acessíveis independente de faturamento */}
              <Route path="assinatura" element={<Faturamento />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="tutoriais" element={<Tutoriais />} />

              {/* Proteção de Faturamento Ativo / Trial Válido */}
              <Route element={<BillingGuard />}>
                <Route path="meu-estudio" element={<Dashboard />} />
                <Route path="link-agendamento" element={<LinkAgendamento />} />
                <Route path="clientes" element={<Clientes />} />
                <Route path="clientes/:id" element={<PerfilCliente />} />
                <Route path="servicos" element={<Servicos />} />
                <Route path="agendamentos" element={<Agendamentos />} />
                <Route path="meus-horarios" element={<MeusHorarios />} />

                {/* Recursos de CRM avançado (relatórios/análises/fichas de anamnese) exclusivos do plano Premium */}
                <Route element={<PlanGuard requiredFeature="crm" />}>
                  <Route path="relatorios" element={<Relatorios />} />
                  <Route path="fichas-anamnese" element={<FichasAnamnese />} />
                  <Route path="fichas-anamnese/:id" element={<FichaAnamneseDetalhe />} />
                </Route>
              </Route>
            </Route>

            {/* Portal da cliente */}
            <Route
              path="/portal/:slug"
              element={
                <PortalProvider>
                  <PortalLayout />
                </PortalProvider>
              }
            >
              <Route index element={<Navigate to="catalogo" replace />} />
              <Route path="catalogo" element={<PortalCatalogo />} />

              {/* Pública: agendamento como convidada (nome + WhatsApp), sem conta/senha.
                  Se já houver sessão de uma reserva anterior, o próprio PortalAgendar usa
                  os dados da sessão em vez de pedir os campos de novo. */}
              <Route path="agendar" element={<PortalAgendar />} />

              {/* "Casa" da cliente logo após agendar como convidada — mantém o token dela
                  na URL, para que a instalação do app (Adicionar à Tela de Início) já
                  aponte pra cá. Também recupera a sessão ao reabrir o app instalado
                  caso ela não tenha sobrevivido à instalação (comum no iOS). */}
              <Route path="app/:token" element={<PortalEntrarApp />} />

              {/* Rotas protegidas do cliente */}
              <Route
                element={
                  <ClienteRoute>
                    <Outlet />
                  </ClienteRoute>
                }
              >
                <Route path="meus-agendamentos" element={<PortalMeusAgendamentos />} />
                <Route path="perfil" element={<PortalPerfil />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </InstallPromptProvider>
  );
}
