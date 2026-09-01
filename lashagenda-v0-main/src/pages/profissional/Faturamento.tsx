import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import {
  Check,
  Sparkles,
  Calendar,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Loader2,
  X,
  CreditCard,
  Lock,
  Info,
} from 'lucide-react';

function PixIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0.002L0.002 12 12 23.998 23.998 12 12 0.002zm0 4.238L19.76 12 12 19.76 4.24 12 12 4.24zm0 3.398L7.638 12 12 16.362 16.362 12 12 7.638z" />
    </svg>
  );
}

function PaymentButtons({
  onPix, onCard, pixLoading, cardLoading, showAsaasInfo, onToggleAsaasInfo,
}: {
  onPix: () => void;
  onCard: () => void;
  pixLoading: boolean;
  cardLoading: boolean;
  showAsaasInfo: boolean;
  onToggleAsaasInfo: () => void;
}) {
  return (
    <div className="space-y-3">
      {/* Pix */}
      <button
        onClick={onPix}
        disabled={pixLoading || cardLoading}
        className="w-full py-3.5 md:py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:shadow-rose-600/15 disabled:opacity-60 disabled:pointer-events-none"
      >
        {pixLoading ? <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" /> : <PixIcon className="w-5 h-5 md:w-4 md:h-4" />}
        Pagar com Pix
      </button>

      {/* Cartão */}
      <div className="space-y-2">
        <button
          onClick={onCard}
          disabled={pixLoading || cardLoading}
          className="btn-outline-payment w-full py-3.5 md:py-3 px-4 bg-surface border border-border hover:bg-bg active:scale-[0.99] text-text-primary rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md disabled:opacity-60 disabled:pointer-events-none"
        >
          {cardLoading ? <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" /> : <CreditCard className="w-5 h-5 md:w-4 md:h-4" />}
          Pagar com Cartão de Crédito
        </button>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-1.5 text-xs md:text-[10px] text-text-muted pt-1">
          <Lock className="w-3.5 h-3.5 md:w-3 md:h-3" />
          <span>Processado com segurança pelo</span>
          <button
            onClick={onToggleAsaasInfo}
            className="font-semibold text-text-secondary underline decoration-dotted cursor-pointer flex items-center gap-0.5"
          >
            Asaas
            <Info className="w-3.5 h-3.5 md:w-3 md:h-3" />
          </button>
        </div>

        {/* Tooltip Asaas */}
        {showAsaasInfo && (
          <div className="text-xs md:text-[10px] bg-blue-50 border border-blue-100 text-blue-700 p-2.5 rounded-lg leading-relaxed animate-fade-in">
            <strong>Asaas</strong> é uma fintech brasileira regulada pelo Banco Central do Brasil, usada por mais de 300 mil empresas para cobranças seguras via Pix, Cartão e Boleto.
          </div>
        )}
      </div>
    </div>
  );
}

export default function Faturamento() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const { isSubscriptionActive, isPremium, status, trialEndsAt } = useSubscription();

  const [loading, setLoading] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'none' | 'cpf' | 'pix' | 'success'>('none');
  const [selectedPlanToBuy, setSelectedPlanToBuy] = useState<'basico' | 'premium'>('premium');
  const [cpfInput, setCpfInput] = useState('');
  const [cpfError, setCpfError] = useState<string | null>(null);

  const [pixQrCodeImage, setPixQrCodeImage] = useState<string | null>(null);
  const [pixKey, setPixKey] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [showAsaasInfo, setShowAsaasInfo] = useState(false);

  const [countdown, setCountdown] = useState(3);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const daysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : 0;

  // Countdown e redirecionamento após pagamento confirmado
  useEffect(() => {
    if (checkoutMode !== 'success') return;
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const dest = selectedPlanToBuy === 'premium' ? '/agendamentos' : '/meu-estudio';
          navigate(dest, { state: { welcomePlano: selectedPlanToBuy } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [checkoutMode, selectedPlanToBuy, navigate]);

  // Para o polling ao desmontar
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (pollingTimeoutRef.current) clearTimeout(pollingTimeoutRef.current);
  };

  // Polling dual: consulta Asaas diretamente (fallback) + verifica DB (captura webhook)
  // Para automaticamente após 15 minutos
  const startPolling = (estabelecimentoId: string, paymentId: string | null) => {
    stopPolling();

    const checkPayment = async () => {
      // 1. Se tiver paymentId, consulta Asaas diretamente (não depende do webhook)
      if (paymentId) {
        try {
          const { data } = await supabase.functions.invoke('asaas-check-payment', {
            body: { payment_id: paymentId, estabelecimento_id: estabelecimentoId },
          });
          if (data?.ativo) {
            stopPolling();
            await refreshProfile();
            setCheckoutMode('success');
            return;
          }
        } catch {
          // Falha na Edge Function → fallback para verificação no DB abaixo
        }
      }

      // 2. Fallback: verifica se webhook já atualizou o banco
      const { data: est } = await supabase
        .from('estabelecimentos')
        .select('status_assinatura')
        .eq('id', estabelecimentoId)
        .single();

      if (est?.status_assinatura === 'ativo') {
        stopPolling();
        await refreshProfile();
        setCheckoutMode('success');
      }
    };

    pollingRef.current = setInterval(checkPayment, 10000);

    // Para o polling após 15 minutos independente do resultado
    pollingTimeoutRef.current = setTimeout(stopPolling, 15 * 60 * 1000);
  };

  const formatCpfCnpj = (value: string): string => {
    const digits = value.replace(/\D/g, '').substring(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const validateCpfCnpj = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 11 || digits.length === 14;
  };

  const handleOpenCpfStep = (plano: 'basico' | 'premium') => {
    setSelectedPlanToBuy(plano);
    setCpfInput('');
    setCpfError(null);
    setCheckoutError(null);
    setCheckoutMode('cpf');
  };

  const handleCpfSubmit = () => {
    if (!validateCpfCnpj(cpfInput)) {
      setCpfError('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }
    handleAsaasCheckout(selectedPlanToBuy, cpfInput.replace(/\D/g, ''));
  };

  // Checkout via cartão — cria assinatura e abre invoiceUrl do Asaas em nova aba
  const handleCardCheckout = async (plano: 'basico' | 'premium') => {
    if (!profile?.estabelecimento_id) return;
    setSelectedPlanToBuy(plano);
    setCardLoading(true);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-checkout', {
        body: {
          estabelecimento_id: profile.estabelecimento_id,
          plano,
          email: profile.email,
          nome:  profile.nome,
          mode:  'card',
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.invoiceUrl) throw new Error('Link de pagamento não disponível.');

      window.open(data.invoiceUrl, '_blank');
      // Cartão não retorna paymentId — polling usa só DB como fallback
      startPolling(profile.estabelecimento_id, data.paymentId ?? null);
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Erro ao gerar link de pagamento.');
    } finally {
      setCardLoading(false);
    }
  };

  // Chama a Edge Function asaas-checkout e exibe QR Code
  const handleAsaasCheckout = async (plano: 'basico' | 'premium', cpfCnpj: string) => {
    if (!profile?.estabelecimento_id) return;
    setLoading(true);
    setCheckoutError(null);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-checkout', {
        body: {
          estabelecimento_id: profile.estabelecimento_id,
          plano,
          email: profile.email,
          nome:  profile.nome,
          cpf_cnpj: cpfCnpj,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setPixQrCodeImage(data.pixQrCodeImage);
      setPixKey(data.pixKey);
      setCheckoutMode('pix');
      startPolling(profile.estabelecimento_id, data.paymentId ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      const isEdgeFnError = msg.toLowerCase().includes('non-2xx') || msg.toLowerCase().includes('edge function');
      setCheckoutError(
        isEdgeFnError
          ? 'CPF ou CNPJ inválido ou não aceito. Verifique os dados e tente novamente.'
          : msg || 'Erro ao gerar cobrança. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile?.estabelecimento_id) return;
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-cancel', {
        body: { estabelecimento_id: profile.estabelecimento_id },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      await refreshProfile();
      setCancelConfirm(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao cancelar assinatura.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBackFromCheckout = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setCheckoutMode('none');
    setPixQrCodeImage(null);
    setPixKey(null);
    setCheckoutError(null);
  };

  return (
    <div className="max-w-5xl mx-auto font-sans">

      {/* Cabeçalho */}
      <div
        className="rounded-[14px] p-5 shadow-sm text-white relative overflow-hidden mb-8"
        style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
      >
        <CreditCard
          className="absolute -top-3 -right-3 w-24 h-24 text-white/15 rotate-12 pointer-events-none select-none"
          strokeWidth={1.25}
        />
        <div className="relative z-10">
          <h1 className="font-title font-semibold text-3xl md:text-2xl">Minha Assinatura</h1>
          <p className="text-sm md:text-xs text-white/80 mt-1 md:mt-0.5">Gerencie os planos do seu estúdio e formas de pagamento.</p>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-8">

        {checkoutMode === 'none' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* PLANO BÁSICO */}
              <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ${!isPremium ? 'border-text-primary ring-2 ring-text-primary/10' : 'border-border'}`}>
                <div>
                  <div className="p-6 bg-gradient-to-br from-rose-200 to-rose-100 border-b border-rose-200/60">
                    <h2 className="font-title font-bold text-xl md:text-lg text-rose-800 flex items-center gap-2">
                      <Calendar className="w-6 h-6 md:w-5 md:h-5 text-rose-600" /> Plano Agenda
                    </h2>
                    <p className="text-sm md:text-xs text-rose-800/90 font-medium mt-1">Ideal para automatizar sua agenda e nunca mais perder um horário no WhatsApp.</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl md:text-2xl font-extrabold font-title text-rose-800">R$ 69,90</span>
                      <span className="text-sm md:text-xs font-semibold text-rose-800/90">/ mês</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {!isPremium && status === 'trial' && (
                      isSubscriptionActive() ? (
                        <div className="py-2 md:py-1.5 text-center text-sm md:text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg border border-amber-200">
                          Seu plano de testes atual — {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                        </div>
                      ) : (
                        <div className="py-2 md:py-1.5 text-center text-sm md:text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-200">
                          Seu período de testes expirou
                        </div>
                      )
                    )}
                    <ul className="space-y-2.5 text-sm md:text-xs text-text-secondary">
                      {['Agendamento automático online', 'Portal exclusivo para suas clientes', 'Cadastro de Clientes e Serviços', 'Confirmação manual ou automática', 'Suporte por E-mail'].map(feat => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-green-600 shrink-0 mt-0.5" />{feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 border-t border-border space-y-2">
                  {!isPremium && status === 'ativo' ? (
                    <>
                      <div className="py-2.5 md:py-2 text-center text-sm md:text-xs font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">Plano Ativo</div>
                      {!cancelConfirm ? (
                        <button
                          onClick={() => setCancelConfirm(true)}
                          className="w-full text-center text-sm md:text-xs font-semibold text-text-muted hover:text-red-600 underline cursor-pointer transition-colors pt-1"
                        >
                          Cancelar assinatura
                        </button>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <p className="text-sm md:text-xs text-text-secondary text-center">Tem certeza? Você perderá o acesso às funcionalidades do plano.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCancelConfirm(false)}
                              className="flex-1 py-2.5 md:py-2 border border-border rounded-xl text-sm md:text-xs font-semibold text-text-secondary cursor-pointer"
                            >
                              Voltar
                            </button>
                            <button
                              onClick={handleCancelSubscription}
                              disabled={cancelLoading}
                              className="flex-1 py-2.5 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm md:text-xs font-semibold cursor-pointer flex items-center justify-center gap-1"
                            >
                              {cancelLoading ? <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" /> : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {!isPremium && status === 'suspenso' && (
                        <div className="inline-flex w-full items-center justify-center gap-1.5 px-3.5 py-1.5 md:px-3 md:py-1 bg-red-50 border border-red-200 text-red-700 text-sm md:text-xs font-semibold rounded-full">
                          <AlertTriangle className="w-4 h-4 md:w-3.5 md:h-3.5" /> Suspenso por Inadimplência
                        </div>
                      )}
                      {!isPremium && status === 'cancelado' && (
                        <div className="inline-flex w-full items-center justify-center gap-1.5 px-3.5 py-1.5 md:px-3 md:py-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm md:text-xs font-semibold rounded-full">
                          <AlertTriangle className="w-4 h-4 md:w-3.5 md:h-3.5" /> Assinatura Cancelada
                        </div>
                      )}
                      <PaymentButtons
                        onPix={() => handleOpenCpfStep('basico')}
                        onCard={() => handleCardCheckout('basico')}
                        pixLoading={loading && selectedPlanToBuy === 'basico'}
                        cardLoading={cardLoading && selectedPlanToBuy === 'basico'}
                        showAsaasInfo={showAsaasInfo}
                        onToggleAsaasInfo={() => setShowAsaasInfo(v => !v)}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* PLANO PREMIUM */}
              <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between ${isPremium ? 'border-rose-600 ring-2 ring-rose-100' : 'border-border'}`}>
                <div>
                  <div className="p-6 bg-gradient-to-br from-rose-200 to-rose-100 border-b border-rose-200/60">
                    <h2 className="font-title font-bold text-xl md:text-lg text-rose-800 flex items-center gap-2">
                      <Sparkles className="w-6 h-6 md:w-5 md:h-5 text-rose-600" /> Plano Premium
                    </h2>
                    <p className="text-sm md:text-xs text-rose-800/90 font-medium mt-1">Para quem quer relatórios completos do negócio e fichas de anamnese profissionais para Lash Designers.</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl md:text-2xl font-extrabold font-title text-rose-800">R$ 99,90</span>
                      <span className="text-sm md:text-xs font-semibold text-rose-800/90">/ mês</span>
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {isPremium && status === 'trial' && (
                      isSubscriptionActive() ? (
                        <div className="py-2 md:py-1.5 text-center text-sm md:text-xs font-semibold text-rose-700 bg-rose-50 rounded-lg border border-rose-200">
                          Seu plano de testes atual — {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                        </div>
                      ) : (
                        <div className="py-2 md:py-1.5 text-center text-sm md:text-xs font-semibold text-red-700 bg-red-50 rounded-lg border border-red-200">
                          Seu período de testes expirou
                        </div>
                      )
                    )}
                    <ul className="space-y-2.5 text-sm md:text-xs text-text-secondary">
                      {['TUDO do Plano Agenda', 'Fichas de Anamnese para Lash Designers', 'Relatórios e Análises completas', 'Histórico de Atendimentos', 'Suporte Prioritário'].map(feat => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="w-4 h-4 md:w-3.5 md:h-3.5 text-green-600 shrink-0 mt-0.5" />
                          <span className={feat.startsWith('TUDO') ? 'font-semibold text-text-primary' : ''}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-6 border-t border-border space-y-2">
                  {isPremium && status === 'ativo' ? (
                    <>
                      <div className="py-2.5 md:py-2 text-center text-sm md:text-xs font-semibold text-green-700 bg-green-50 rounded-xl border border-green-200">Plano Ativo</div>
                      {!cancelConfirm ? (
                        <button
                          onClick={() => setCancelConfirm(true)}
                          className="w-full text-center text-sm md:text-xs font-semibold text-text-muted hover:text-red-600 underline cursor-pointer transition-colors pt-1"
                        >
                          Cancelar assinatura
                        </button>
                      ) : (
                        <div className="space-y-2 pt-1">
                          <p className="text-sm md:text-xs text-text-secondary text-center">Tem certeza? Você perderá o acesso às funcionalidades do plano.</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setCancelConfirm(false)}
                              className="flex-1 py-2.5 md:py-2 border border-border rounded-xl text-sm md:text-xs font-semibold text-text-secondary cursor-pointer"
                            >
                              Voltar
                            </button>
                            <button
                              onClick={handleCancelSubscription}
                              disabled={cancelLoading}
                              className="flex-1 py-2.5 md:py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm md:text-xs font-semibold cursor-pointer flex items-center justify-center gap-1"
                            >
                              {cancelLoading ? <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" /> : 'Confirmar'}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {isPremium && status === 'suspenso' && (
                        <div className="inline-flex w-full items-center justify-center gap-1.5 px-3.5 py-1.5 md:px-3 md:py-1 bg-red-50 border border-red-200 text-red-700 text-sm md:text-xs font-semibold rounded-full">
                          <AlertTriangle className="w-4 h-4 md:w-3.5 md:h-3.5" /> Suspenso por Inadimplência
                        </div>
                      )}
                      {isPremium && status === 'cancelado' && (
                        <div className="inline-flex w-full items-center justify-center gap-1.5 px-3.5 py-1.5 md:px-3 md:py-1 bg-gray-50 border border-gray-200 text-gray-700 text-sm md:text-xs font-semibold rounded-full">
                          <AlertTriangle className="w-4 h-4 md:w-3.5 md:h-3.5" /> Assinatura Cancelada
                        </div>
                      )}
                      <PaymentButtons
                        onPix={() => handleOpenCpfStep('premium')}
                        onCard={() => handleCardCheckout('premium')}
                        pixLoading={loading && selectedPlanToBuy === 'premium'}
                        cardLoading={cardLoading && selectedPlanToBuy === 'premium'}
                        showAsaasInfo={showAsaasInfo}
                        onToggleAsaasInfo={() => setShowAsaasInfo(v => !v)}
                      />
                    </>
                  )}
                </div>
              </div>

              {checkoutError && (
                <div className="md:col-span-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm md:text-xs">
                  <X className="w-5 h-5 md:w-4 md:h-4 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

            </div>
          )}

          {/* Passo CPF/CNPJ */}
          {checkoutMode === 'cpf' && (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-6 md:p-8 animate-fade-in">
              <h2 className="font-title font-bold text-2xl md:text-xl text-text-primary mb-1">
                Informação para cobrança
              </h2>
              <p className="text-base md:text-sm text-text-secondary mb-6">
                O Asaas exige CPF ou CNPJ para processar cobranças via Pix. Seus dados são usados apenas para emissão da cobrança.
              </p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-xs font-bold uppercase tracking-wider text-text-secondary block">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfInput}
                    onChange={(e) => {
                      setCpfInput(formatCpfCnpj(e.target.value));
                      setCpfError(null);
                      setCheckoutError(null);
                    }}
                    className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                    onKeyDown={(e) => e.key === 'Enter' && handleCpfSubmit()}
                  />
                  {cpfError && <p className="text-sm md:text-xs text-red-600">{cpfError}</p>}
                </div>
                {checkoutError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm md:text-xs">
                    <X className="w-5 h-5 md:w-4 md:h-4 shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleCpfSubmit}
                    disabled={loading}
                    className="w-full py-4 md:py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg hover:shadow-rose-600/15 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin" /> : <PixIcon className="w-5 h-5 md:w-4 md:h-4" />}
                    Gerar QR Code Pix
                  </button>
                  <button
                    onClick={() => setCheckoutMode('none')}
                    className="w-full py-3.5 md:py-3 border border-border hover:bg-bg active:scale-[0.99] text-text-secondary rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-all duration-200 cursor-pointer text-center"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Pix */}
          {checkoutMode === 'pix' && (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-6 md:p-8 animate-fade-in">
              <h2 className="font-title font-bold text-2xl md:text-xl text-text-primary mb-1 flex items-center gap-2">
                <PixIcon className="w-6 h-6 md:w-5 md:h-5 text-rose-600" />
                Pague via Pix — Plano {selectedPlanToBuy === 'premium' ? 'Premium' : 'Agenda'}
              </h2>
              <p className="text-base md:text-sm text-text-secondary mb-6">Escaneie o QR Code ou copie o código Pix abaixo. O acesso é liberado automaticamente após a confirmação.</p>

              <div className="flex flex-col items-center gap-6">
                {/* QR Code */}
                {pixQrCodeImage ? (
                  <div className="p-3 bg-white border-2 border-border rounded-2xl shadow-inner">
                    <img src={`data:image/png;base64,${pixQrCodeImage}`} alt="QR Code Pix" className="w-52 h-52" />
                  </div>
                ) : (
                  <div className="w-52 h-52 bg-bg border border-border rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-rose-400 animate-spin" />
                  </div>
                )}

                {/* Código copia e cola */}
                {pixKey && (
                  <div className="w-full space-y-2">
                    <p className="text-sm md:text-xs font-semibold text-text-secondary uppercase tracking-wider">Código Pix — Copia e Cola</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-3.5 md:p-3 bg-bg border border-border rounded-xl text-sm md:text-xs font-mono text-text-secondary break-all select-all">
                        {pixKey}
                      </div>
                      <button
                        onClick={handleCopyPix}
                        className="shrink-0 p-3 md:p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
                        title="Copiar código Pix"
                      >
                        {copied ? <CheckCircle2 className="w-5 h-5 md:w-4 md:h-4" /> : <Copy className="w-5 h-5 md:w-4 md:h-4" />}
                      </button>
                    </div>
                    {copied && <p className="text-sm md:text-xs text-green-600 font-semibold">Copiado!</p>}
                  </div>
                )}

                {/* Status de aguardo */}
                <div className="flex items-center gap-2 text-sm md:text-xs text-text-muted">
                  <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 animate-spin" />
                  Aguardando confirmação do pagamento...
                </div>

                <button
                  onClick={handleBackFromCheckout}
                  className="text-sm md:text-xs text-text-secondary hover:text-rose-600 underline cursor-pointer transition-colors"
                >
                  Cancelar e voltar
                </button>
              </div>
            </div>
          )}

          {/* Sucesso */}
          {checkoutMode === 'success' && (
            <div className="bg-white border border-green-200 rounded-2xl shadow-sm p-8 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="font-title font-bold text-2xl md:text-xl text-text-primary mb-1">Pagamento Confirmado!</h2>
              <p className="text-base md:text-sm text-text-secondary mb-1">
                Seu Plano {selectedPlanToBuy === 'premium' ? 'Premium' : 'Agenda'} está ativo. Bem-vinda!
              </p>
              <p className="text-sm md:text-xs text-text-muted mb-6">
                Redirecionando para{' '}
                <span className="font-semibold text-text-secondary">
                  {selectedPlanToBuy === 'premium' ? 'Agendamentos' : 'Meu Estúdio'}
                </span>{' '}
                em {countdown}...
              </p>
              <button
                onClick={() => navigate(
                  selectedPlanToBuy === 'premium' ? '/agendamentos' : '/meu-estudio',
                  { state: { welcomePlano: selectedPlanToBuy } }
                )}
                className="px-8 py-4 md:py-3.5 bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:shadow-rose-600/15"
              >
                Ir agora →
              </button>
            </div>
          )}

      </div>
    </div>
  );
}
