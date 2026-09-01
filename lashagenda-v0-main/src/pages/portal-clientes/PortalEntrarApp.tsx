import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, ClipboardList, BookOpen, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// "Casa" da cliente dentro do app instalado (PWA) na tela inicial.
//
// Depois de agendar como convidada, a cliente é trazida pra cá (ver
// PortalAgendar) e permanece nesta URL até navegar por conta própria — é
// justamente aqui, com o banner "Instalar App" visível, que ela costuma
// tocar em "Adicionar à Tela de Início". Como o manifest.json não define
// start_url (ver public/manifest.json), o Safari usa a página atual como
// ponto de partida do ícone instalado — por isso é essencial que a URL
// aqui já contenha o token permanente da cliente.
//
// Se o app instalado abrir aqui numa sessão nova (ex: a sessão anônima não
// sobreviveu à instalação, algo comum no iOS), o token na URL é usado pra
// recriar a sessão sem pedir nada da cliente de novo.
export default function PortalEntrarApp() {
  const { slug, token } = useParams<{ slug: string; token: string }>();
  const { user, isCliente, profile, loading: authLoading } = useAuth();
  const started = useRef(false);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (authLoading || started.current) return;
    started.current = true;

    // Já tem sessão de cliente válida (acabou de agendar, ou o app já
    // guardava a sessão de uma abertura anterior) — nada a fazer.
    if (user && isCliente) return;

    async function entrar() {
      if (!slug || !token) {
        setErro(true);
        return;
      }

      const { data, error } = await supabase.rpc('get_cliente_by_portal_token', {
        p_slug: slug,
        p_token: token,
      });

      const cliente = Array.isArray(data) ? data[0] : data;

      if (error || !cliente) {
        setErro(true);
        return;
      }

      const { error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            role: 'cliente',
            nome: cliente.nome,
            cliente_id: cliente.cliente_id,
            estabelecimento_id: cliente.estabelecimento_id,
          },
        },
      });

      if (authError) setErro(true);
    }

    entrar();
  }, [authLoading, user, isCliente, slug, token]);

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-24 max-w-md mx-auto">
        <p className="text-text-secondary">Não conseguimos carregar seus dados automaticamente.</p>
        <Link
          to={`/portal/${slug}/agendar`}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          Agendar
        </Link>
      </div>
    );
  }

  if (authLoading || !user || !isCliente) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 animate-pulse">
        <img src="/icon-192.png" alt="Lash Agenda" className="w-16 h-16 rounded-2xl shadow-md" />
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-bounce"></div>
        </div>
      </div>
    );
  }

  const primeiroNome = profile?.nome?.split(' ')[0] || 'Cliente';

  return (
    <div className="flex flex-col items-center text-center gap-6 py-12 max-w-md mx-auto w-full">
      <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
        <Heart className="w-8 h-8 text-rose-600 fill-rose-600" />
      </div>
      <h2 className="font-title text-2xl font-bold text-text-primary">Olá, {primeiroNome}!</h2>

      <div className="flex flex-col gap-3 w-full">
        <Link
          to={`/portal/${slug}/meus-agendamentos`}
          className="flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          Meus agendamentos
        </Link>
        <Link
          to={`/portal/${slug}/catalogo`}
          className="flex items-center justify-center gap-2 py-3 border border-border text-text-secondary hover:bg-bg rounded-xl text-sm font-semibold transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Ver catálogo
        </Link>
        <Link
          to={`/portal/${slug}/perfil`}
          className="flex items-center justify-center gap-2 py-3 border border-border text-text-secondary hover:bg-bg rounded-xl text-sm font-semibold transition-colors"
        >
          <UserIcon className="w-4 h-4" />
          Meu perfil
        </Link>
      </div>
    </div>
  );
}
