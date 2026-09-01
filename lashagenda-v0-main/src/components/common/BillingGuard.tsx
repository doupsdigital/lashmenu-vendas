import { Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { ShieldAlert, CreditCard, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import Modal from './Modal';

export default function BillingGuard() {
  const { isProfissional, signOut, loading: authLoading } = useAuth();
  const { isSubscriptionActive, status, loading: subLoading } = useSubscription();
  const location = useLocation();

  const loading = authLoading || subLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Se não for profissional (ex: cliente final no portal), não aplica este bloqueio
  if (!isProfissional) {
    return <Outlet />;
  }

  // Se a assinatura estiver ativa, libera o acesso normalmente
  if (isSubscriptionActive()) {
    return <Outlet />;
  }

  // Permite acesso direto à rota de faturamento para que a profissional possa assinar/regularizar
  if (location.pathname === '/assinatura' || location.pathname === '/configuracoes') {
    return <Outlet />;
  }

  // Determinar o conteúdo com base no status da assinatura
  let title = 'Acesso Administrativo Bloqueado';
  let message = 'Assinatura inativa. Entre em contato ou ative seu plano para acessar o sistema.';
  let iconColor = 'text-rose-500 bg-rose-50';

  if (status === 'trial') {
    title = 'Seu período de testes expirou';
    message = 'Seus 7 dias grátis acabaram. Escolha um plano pra continuar usando a agenda.';
    iconColor = 'text-amber-500 bg-amber-50';
  } else if (status === 'suspenso') {
    title = 'Assinatura suspensa';
    message = 'Não conseguimos processar o pagamento no Asaas. Atualize seus dados para liberar o acesso.';
    iconColor = 'text-red-500 bg-red-50';
  } else if (status === 'cancelado') {
    title = 'Sua assinatura foi cancelada';
    message = 'Sua conta foi desativada temporariamente. Reative o plano para voltar a usar a agenda.';
    iconColor = 'text-gray-500 bg-gray-50';
  }

  const handleSignOut = async () => {
    await signOut();
  };

  // A TrialBanner (faixa de aviso de trial) ocupa espaço extra logo abaixo do
  // header nesse mesmo caso (status "trial"), então reservamos essa altura
  // pra não ficar por baixo dela.
  const hasTrialBanner = status === 'trial';

  return (
    <Modal>
    <div
      className={`fixed inset-x-0 bottom-[88px] md:bottom-0 z-30 bg-bg overflow-hidden flex items-center justify-center px-4 py-4 font-sans ${
        hasTrialBanner ? 'top-[100px]' : 'top-[60px]'
      }`}
    >
      {/* Decorações em degradê de fundo */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[500px] max-h-full overflow-y-auto overscroll-contain bg-white border border-border rounded-[24px] shadow-2xl p-6 md:p-10 relative z-10 text-center animate-fade-in">

        {/* Ícone de Alerta */}
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-2xl ${iconColor} shadow-inner transition-transform duration-300 hover:scale-105`}>
            {status === 'trial' ? (
              <Sparkles className="w-9 h-9" />
            ) : (
              <ShieldAlert className="w-9 h-9" />
            )}
          </div>
        </div>

        {/* Título Principal */}
        <h2 className="font-title font-bold text-3xl md:text-2xl text-text-primary mb-2 leading-snug">
          {title}
        </h2>

        {/* Descrição Amigável */}
        <p className="text-sm md:text-xs text-text-secondary mb-5 leading-relaxed">
          {message}
        </p>

        {/* Caixa de Benefícios em Destaque */}
        <div className="bg-rose-50/30 border border-rose-100/50 rounded-xl p-3.5 mb-5 text-left">
          <p className="text-sm md:text-xs font-semibold text-text-primary mb-2">Ao assinar, você recupera acesso a:</p>
          <ul className="space-y-1.5 text-sm md:text-xs text-text-secondary">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              Fichas de anamnese completas
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              Relatórios e análises do negócio
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              Histórico completo de atendimentos
            </li>
          </ul>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-3">
          <Link
            to="/assinatura"
            className="w-full py-3.5 md:py-3 px-5 md:px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-all duration-200 shadow-md shadow-rose-100 hover:shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
          >
            <CreditCard className="w-5 h-5 md:w-4 md:h-4" />
            <span>Regularizar Financeiro</span>
            <ArrowRight className="w-5 h-5 md:w-4 md:h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full py-3.5 md:py-3 px-5 md:px-4 border border-border hover:bg-bg rounded-full md:rounded-xl text-sm md:text-xs font-bold md:font-semibold text-text-secondary hover:text-rose-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-5 h-5 md:w-4 md:h-4" />
            <span>Sair da Minha Conta</span>
          </button>
        </div>

      </div>
    </div>
    </Modal>
  );
}
