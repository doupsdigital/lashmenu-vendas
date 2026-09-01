import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ClienteRoute({ children }: { children: React.ReactNode }) {
  const { user, isCliente, loading } = useAuth();
  const { slug } = useParams<{ slug: string }>();

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

  // Sem login de cliente no portal: quem ainda não tem sessão (nenhuma reserva
  // como convidada nesta sessão) é levado para o agendamento, não para uma tela de login.
  if (!user || !isCliente) return <Navigate to={slug ? `/portal/${slug}/agendar` : '/login'} replace />;

  return <>{children}</>;
}
