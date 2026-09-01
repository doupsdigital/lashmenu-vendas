import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import GoogleAuthButton from '../../components/common/GoogleAuthButton';

export default function Login() {
  const { user, isProfissional, estabelecimentoSlug, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Se auth resolveu sem usuário (ex: perfil não encontrado), libera o botão
  useEffect(() => {
    if (!authLoading && !user) setSubmitting(false);
  }, [authLoading, user]);

  // Redireciona usuário já autenticado.
  // Nota: não redireciona quando isProfissional=false e slug=null — isso é um
  // estado TRANSITÓRIO entre o setUser() e o carregamento do perfil. Redirecionar
  // para /login nesse momento cria um loop infinito após sign-out + novo login.
  //
  // Importante: precisa ser uma navegação de verdade (window.location), não
  // <Navigate>/navigate() do React Router. Quem chega aqui vindo da landing page
  // (Cadastre-se grátis → Já tenho login) nunca teve um carregamento real de
  // página nesse domínio além da landing — e o Safari usa a URL do último
  // carregamento real para "Adicionar à Tela de Início", ignorando trocas via
  // history.pushState/replaceState. Sem isso, o app instalado sempre reabre na
  // landing page em vez do painel.
  useEffect(() => {
    if (!authLoading && user) {
      if (isProfissional) {
        window.location.replace('/meu-estudio');
      } else if (estabelecimentoSlug) {
        window.location.replace(`/portal/${estabelecimentoSlug}/catalogo`);
      }
    }
  }, [authLoading, user, isProfissional, estabelecimentoSlug]);

  if (!authLoading && user && (isProfissional || estabelecimentoSlug)) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      // Redirect acontece automaticamente quando o perfil é carregado
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login.';
      setErrorMsg(
        message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos. Verifique suas credenciais.'
          : message
      );
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans"
      style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
    >
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] bg-white border border-border rounded-[20px] shadow-xl p-8 md:p-10 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white flex items-center justify-center shadow-lg mb-4 hover:scale-105 transition-transform duration-300 overflow-hidden">
            <img
              src="/logo-login.png"
              alt="Lash Agenda"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-title font-bold text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-rose-400">
            Lash Agenda
          </h1>
          <p className="text-sm text-text-secondary mt-2 font-medium italic leading-relaxed max-w-[300px]">
            Sua agenda e suas clientes em um só lugar.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <GoogleAuthButton label="Entrar com Google" />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm font-semibold text-text-secondary">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                name="email"
                autoComplete="username"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-text-secondary block">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl bg-bg text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-rose-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center cursor-pointer mt-6"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <div className="flex flex-col items-center gap-3 mt-6">
          <p className="text-xs text-text-secondary">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-rose-600 font-semibold hover:underline">
              Cadastre-se
            </Link>
          </p>
          <Link to="/recuperar-senha" className="text-xs text-rose-600 font-semibold hover:underline">
            Esqueci minha senha
          </Link>
        </div>
      </div>
    </div>
  );
}
