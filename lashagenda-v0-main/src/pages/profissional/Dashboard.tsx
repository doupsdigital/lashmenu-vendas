import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import posthog from 'posthog-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useGuidedTour } from '../../hooks/useGuidedTour';
import PushPermissionBanner from '../../components/common/PushPermissionBanner';
import InstallBanner from '../../components/common/InstallBanner';
import TrancarHorarioSheet from '../../components/common/TrancarHorarioSheet';
import AgendamentoFormSheet from '../../components/common/AgendamentoFormSheet';
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CircleDollarSign,
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Tag,
  UserPlus,
  Clock,
  Copy,
  Check,
  Crown,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from 'recharts';

const formatDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const WEEK_DAYS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Bom dia';
  if (h >= 12 && h < 18) return 'Boa tarde';
  return 'Boa noite';
};

const getDateString = () => {
  const now = new Date();
  return `${WEEK_DAYS[now.getDay()]}, ${now.getDate()} de ${MONTHS_PT[now.getMonth()]}`;
};

export default function Dashboard() {
  const { estabelecimentoId, estabelecimentoSlug, profile } = useAuth();
  const { isPremium } = useSubscription();
  const navigate = useNavigate();
  const { autoStart } = useOnboarding('meu_estudio', { isPremium });
  const { eligible: guidedTourEligible, visible: guidedTourVisible, currentStep: guidedTourStep } = useGuidedTour();

  const [pendingAppointments, setPendingAppointments] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [heroRevenue, setHeroRevenue] = useState(0);
  const [heroNewClients, setHeroNewClients] = useState(0);
  const [last7DaysRevData, setLast7DaysRevData] = useState<{ name: string; Valor: number }[]>([]);
  const [revenueGrowth, setRevenueGrowth] = useState<number | null>(null);
  const [heroLoading, setHeroLoading] = useState(true);

  const [linkCopied, setLinkCopied] = useState(false);
  const [isStatusInfoOpen, setIsStatusInfoOpen] = useState(false);
  const [isTrancarOpen, setIsTrancarOpen] = useState(false);
  const [isNovoAgendamentoOpen, setIsNovoAgendamentoOpen] = useState(false);

  const firstName = profile?.nome?.split(' ')[0] || '';

  // Dispara o tour de onboarding na primeira visita
  useEffect(() => {
    if (!profile || guidedTourEligible) return;
    autoStart();
  }, [profile, guidedTourEligible]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    if (!estabelecimentoId) return;
    setHeroLoading(true);
    setLoading(true);
    setErrorMsg(null);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

      const last7End = new Date(); last7End.setHours(23, 59, 59, 999);
      const last7Start = new Date(); last7Start.setDate(now.getDate() - 6); last7Start.setHours(0, 0, 0, 0);
      const prev7End = new Date(); prev7End.setDate(now.getDate() - 7); prev7End.setHours(23, 59, 59, 999);
      const prev7Start = new Date(); prev7Start.setDate(now.getDate() - 13); prev7Start.setHours(0, 0, 0, 0);

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

      const monthStartDate = monthStart.split('T')[0];
      const monthEndDate = monthEnd.split('T')[0];
      const last7StartDate = formatDateStr(last7Start);
      const last7EndDate = formatDateStr(last7End);
      const prev7StartDate = formatDateStr(prev7Start);
      const prev7EndDate = formatDateStr(prev7End);

      const [monthRevRes, newClientsRes, last7Res, prev7Res, pendingRes, todayRes,
             monthAtendRes, last7AtendRes, prev7AtendRes] = await Promise.all([
        supabase.from('agendamentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', monthStart).lte('data_hora', monthEnd),
        supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estabelecimento_id', estabelecimentoId).gte('created_at', monthStart).lte('created_at', monthEnd),
        supabase.from('agendamentos').select('data_hora, valor_cobrado').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', last7Start.toISOString()).lte('data_hora', last7End.toISOString()),
        supabase.from('agendamentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).eq('status', 'concluido').gte('data_hora', prev7Start.toISOString()).lte('data_hora', prev7End.toISOString()),
        supabase.from('agendamentos').select('id', { count: 'exact', head: true }).eq('estabelecimento_id', estabelecimentoId).eq('status', 'pendente'),
        supabase.from('agendamentos').select(`id, data_hora, status, valor_cobrado, cliente:clientes(id, nome, sobrenome), agendamento_servicos(servico:servicos(nome))`).eq('estabelecimento_id', estabelecimentoId).gte('data_hora', todayStart).lte('data_hora', todayEnd).neq('status', 'cancelado').order('data_hora', { ascending: true }),
        supabase.from('atendimentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', monthStartDate).lte('data_atendimento', monthEndDate),
        supabase.from('atendimentos').select('data_atendimento, valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', last7StartDate).lte('data_atendimento', last7EndDate),
        supabase.from('atendimentos').select('valor_cobrado').eq('estabelecimento_id', estabelecimentoId).gte('data_atendimento', prev7StartDate).lte('data_atendimento', prev7EndDate),
      ]);

      const agendMonthRev = (monthRevRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      const atendMonthRev = (monthAtendRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      setHeroRevenue(agendMonthRev + atendMonthRev);
      setHeroNewClients(newClientsRes.count ?? 0);
      setPendingAppointments(pendingRes.count ?? 0);
      setTodayAppointments(todayRes.data || []);

      const last7Rev = (last7Res.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0)
                     + (last7AtendRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      const prev7Rev = (prev7Res.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0)
                     + (prev7AtendRes.data || []).reduce((sum, a) => sum + Number(a.valor_cobrado || 0), 0);
      if (prev7Rev > 0) setRevenueGrowth(((last7Rev - prev7Rev) / prev7Rev) * 100);
      else if (last7Rev > 0) setRevenueGrowth(100);
      else setRevenueGrowth(null);

      const dailyMap = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        dailyMap.set(formatDateStr(d), 0);
      }
      (last7Res.data || []).forEach(a => {
        const k = formatDateStr(new Date(a.data_hora));
        if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k)! + Number(a.valor_cobrado || 0));
      });
      (last7AtendRes.data || []).forEach(a => {
        const k = a.data_atendimento;
        if (dailyMap.has(k)) dailyMap.set(k, dailyMap.get(k)! + Number(a.valor_cobrado || 0));
      });
      setLast7DaysRevData(
        Array.from(dailyMap.entries()).map(([dateStr, valor]) => ({
          name: dateStr.slice(8) + '/' + dateStr.slice(5, 7),
          Valor: valor,
        }))
      );

    } catch (err) {
      console.error(err);
      setErrorMsg('Falha ao carregar dados da tela inicial.');
    } finally {
      setHeroLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estabelecimentoId) fetchData();
  }, [estabelecimentoId]);

  const todayRevenue = todayAppointments
    .filter((a: any) => a.status === 'concluido')
    .reduce((sum: number, a: any) => sum + Number(a.valor_cobrado || 0), 0);

  const handleCopyLink = async () => {
    if (!estabelecimentoSlug) return;
    const portalUrl = `${window.location.origin}/portal/${estabelecimentoSlug}`;
    posthog.capture('link_agendamento_copiado');
    try {
      await navigator.clipboard.writeText(portalUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      const el = document.createElement('textarea');
      el.value = portalUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  const quickActions = [
    { label: 'Novo Agendamento', id: 'onboarding-btn-novo-agendamento', Icon: CalendarCheck, onClick: () => setIsNovoAgendamentoOpen(true) },
    { label: 'Bloquear Horário', id: 'onboarding-btn-bloquear', Icon: CalendarX, onClick: () => setIsTrancarOpen(true) },
    { label: 'Novo Serviço', id: 'onboarding-btn-novo-servico', Icon: Tag, onClick: () => navigate('/servicos', { state: {} }) },
    { label: 'Ver Agenda do Dia', id: 'onboarding-btn-agenda-dia', Icon: CalendarDays, onClick: () => navigate('/agendamentos', { state: { filterToday: true } }) },
  ];

  const proximosClientesCard = (
    <div id="onboarding-proximas-clientes" className="bg-white border border-border rounded-2xl p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <h2 className="font-sans font-bold md:font-semibold text-lg md:text-base text-text-primary flex items-center gap-2">
            <CalendarDays className="w-5 h-5 md:w-4 md:h-4 text-rose-600" />
            Próximas clientes
          </h2>
          <button
            onClick={() => setIsStatusInfoOpen(true)}
            title="Como ler os status"
            className="w-5 h-5 rounded-full bg-bg text-text-muted hover:text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={() => navigate('/agendamentos')}
          className="flex items-center gap-1 text-sm md:text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer shrink-0"
        >
          Ver agenda <ArrowRight className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600" />
        </div>
      ) : todayAppointments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-text-muted border border-dashed border-border/60 rounded-xl">
          <Sparkles className="w-6 h-6 text-rose-200 mb-2" />
          <p className="text-sm md:text-xs font-semibold">Nenhum atendimento hoje.</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto">
          {todayAppointments.map((appt: any) => {
            const hora = new Date(appt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const cliente = appt.cliente;
            const servicos = (appt.agendamento_servicos || []).map((as: any) => as.servico?.nome).filter(Boolean).join(', ');
            const isPending = appt.status === 'pendente';
            const isFalta = appt.status === 'falta';
            return (
              <div
                key={appt.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                  ${isPending ? 'border-amber-200 bg-amber-50/40' :
                    isFalta ? 'border-red-200 bg-red-50/30 hover:bg-red-50/50' :
                    'border-border bg-bg/30 hover:bg-bg/60'}`}
              >
                <span className={`text-base md:text-sm font-title font-bold w-12 md:w-11 flex-shrink-0
                  ${isPending ? 'text-amber-700' : isFalta ? 'text-red-700' : 'text-rose-600'}`}
                >
                  {hora}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base md:text-sm font-semibold text-text-primary truncate">
                    {cliente?.nome} {cliente?.sobrenome}
                  </p>
                  <p className="text-xs md:text-[11px] text-text-secondary truncate">{servicos || 'Sem serviços'}</p>
                </div>
                <span className={`text-xs md:text-[10px] font-bold px-2.5 md:px-2 py-1 md:py-0.5 rounded-full flex-shrink-0 whitespace-nowrap
                  ${appt.status === 'confirmado' ? 'bg-green-100 text-green-700' : ''}
                  ${appt.status === 'pendente' ? 'bg-amber-100 text-amber-700' : ''}
                  ${appt.status === 'concluido' ? 'bg-blue-100 text-blue-700' : ''}
                  ${appt.status === 'falta' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  {appt.status === 'confirmado' ? 'Confirmado' :
                   appt.status === 'pendente' ? 'Aguardando' :
                   appt.status === 'falta' ? 'Falta' : 'Concluído'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const shareLinkCard = (
    <div
      id="onboarding-share-link"
      className={`rounded-2xl p-5 md:p-6 bg-gradient-to-br from-rose-200 to-rose-100 border border-rose-200/60 relative overflow-hidden shadow-sm h-full flex flex-col items-center justify-center text-center transition-all ${guidedTourVisible && guidedTourStep === 'link' ? 'ring-4 ring-rose-300 animate-pulse' : ''}`}
    >
      <CalendarCheck
        className="absolute -top-3 -right-3 w-24 h-24 text-rose-300/50 rotate-12 pointer-events-none select-none"
        strokeWidth={1.25}
      />

      <div className="relative z-10 flex flex-col items-center">
        <h2 className="font-title font-bold text-xl text-rose-800 mb-1.5 md:mb-1">Compartilhe sua Agenda</h2>
        <p className="text-base md:text-sm text-rose-800/70 mb-3 md:mb-4 max-w-md text-balance">
          Envie o link do seu portal para suas clientes agendarem sozinhas, quando quiserem.
        </p>
        <button
          onClick={handleCopyLink}
          disabled={!estabelecimentoSlug}
          className="inline-flex items-center gap-2 px-6 py-3 md:px-5 md:py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold shadow-sm transition-all cursor-pointer"
        >
          {linkCopied ? <Check className="w-5 h-5 md:w-4 md:h-4" /> : <Copy className="w-5 h-5 md:w-4 md:h-4" />}
          {linkCopied ? 'Link copiado!' : 'Copiar Link Público'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6">

      <PushPermissionBanner />
      <InstallBanner />

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* ── BANNER DE SAUDAÇÃO ── */}
      <div className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}>
        <div className="absolute top-4 right-5 text-white/50 pointer-events-none select-none leading-none text-lg font-light">
          ✦<br /><span className="text-sm">✦</span>
        </div>
        <div>
          <h1 className="font-title font-bold text-4xl md:text-4xl">
            {getGreeting()}{firstName ? `, ${firstName}!` : '!'}
          </h1>
          <p className="text-base md:text-sm text-white/70 mt-2 md:mt-1.5">
            Aqui está o resumo do seu dia — {getDateString()}.
          </p>
          {isPremium && (
            <div className="flex justify-end">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 rounded-full bg-white/15 backdrop-blur-sm text-sm md:text-xs font-bold tracking-wide">
                <Crown className="w-4 h-4 md:w-3.5 md:h-3.5" />
                PREMIUM
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      {isPremium ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          <div id="onboarding-card-faturamento" className="relative overflow-hidden bg-white border border-border rounded-2xl p-4 shadow-sm">
            <CircleDollarSign className="absolute -top-3 -right-3 w-16 h-16 text-rose-200 rotate-12 pointer-events-none select-none" strokeWidth={1.25} />
            <div className="relative z-10 min-w-0">
              <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Faturamento do Mês</p>
              <p className="font-title font-semibold text-2xl md:text-xl text-rose-600 mt-1.5">
                {heroLoading ? '—' : `R$ ${heroRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

          <div
            id="onboarding-card-hoje"
            onClick={() => navigate('/agendamentos', { state: { filterToday: true } })}
            className="relative overflow-hidden bg-white border border-border rounded-2xl p-4 shadow-sm cursor-pointer hover:border-rose-200 hover:shadow-md transition-all"
          >
            <CalendarDays className="absolute -top-3 -right-3 w-16 h-16 text-rose-200 rotate-12 pointer-events-none select-none" strokeWidth={1.25} />
            <div className="relative z-10 min-w-0">
              <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Agendamentos Hoje</p>
              <p className="font-title font-semibold text-2xl md:text-xl text-text-primary mt-1.5">
                {loading ? '—' : todayAppointments.length}
              </p>
            </div>
          </div>

          <div
            id="onboarding-card-pendentes"
            onClick={() => pendingAppointments > 0 && navigate('/agendamentos', { state: { openPending: true } })}
            className={`relative overflow-hidden bg-white border border-amber-200 rounded-2xl p-4 shadow-sm ${pendingAppointments > 0 ? 'cursor-pointer hover:bg-amber-50/60 transition-colors' : ''}`}
          >
            <Clock className="absolute -top-3 -right-3 w-16 h-16 text-amber-200 rotate-12 pointer-events-none select-none" strokeWidth={1.25} />
            <div className="relative z-10 min-w-0">
              <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-amber-600 leading-tight">Aguardando Confirmação</p>
              <p className="font-title font-semibold text-2xl md:text-xl text-amber-700 mt-1.5">
                {loading ? '—' : pendingAppointments}
              </p>
            </div>
          </div>

          <div id="onboarding-card-clientes" className="relative overflow-hidden bg-white border border-border rounded-2xl p-4 shadow-sm">
            <UserPlus className="absolute -top-3 -right-3 w-16 h-16 text-rose-200 rotate-12 pointer-events-none select-none" strokeWidth={1.25} />
            <div className="relative z-10 min-w-0">
              <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Novas Clientes</p>
              <p className="font-title font-semibold text-2xl md:text-xl text-text-primary mt-1.5">
                {heroLoading ? '—' : heroNewClients}
              </p>
            </div>
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">

          <div
            id="onboarding-card-hoje"
            onClick={() => pendingAppointments > 0 && navigate('/agendamentos', { state: { openPending: true } })}
            className={`relative overflow-hidden bg-white border border-amber-200 rounded-2xl p-4 shadow-sm ${pendingAppointments > 0 ? 'cursor-pointer hover:bg-amber-50/60 transition-colors' : ''}`}
          >
            <Clock className="absolute -top-3 -right-3 w-16 h-16 text-amber-200 rotate-12 pointer-events-none select-none" strokeWidth={1.25} />
            <div className="relative z-10 min-w-0">
              <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-amber-600 leading-tight">Aguardando Confirmação</p>
              <p className="font-title font-semibold text-2xl md:text-xl text-amber-700 mt-1.5">
                {loading ? '—' : pendingAppointments}
              </p>
            </div>
          </div>

          <div id="onboarding-card-faturamento" className="relative overflow-hidden bg-white border border-border rounded-2xl p-4 shadow-sm">
            <CircleDollarSign className="absolute -top-3 -right-3 w-16 h-16 text-rose-200 rotate-12 pointer-events-none select-none" strokeWidth={1.25} />
            <div className="relative z-10 min-w-0">
              <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-text-muted leading-tight">Faturado Hoje</p>
              <p className="font-title font-semibold text-2xl md:text-xl text-rose-600 mt-1.5">
                {loading ? '—' : `R$ ${todayRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ── COMPARTILHAR AGENDA (largura toda, so no Premium -- no free/trial ela entra pareada com Proximas clientes la embaixo) ── */}
      {isPremium && shareLinkCard}

      {/* ── AÇÕES RÁPIDAS + PRÓXIMOS CLIENTES (apenas Premium) ── */}
      {isPremium ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">

          {/* Left column */}
          <div className="space-y-5">

            {/* Quick Actions */}
            <div>
              <h2 className="font-sans font-bold md:font-semibold text-lg md:text-base text-text-primary mb-3">Ações Rápidas</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map(({ label, id, Icon, onClick }) => (
                  <button
                    key={label}
                    id={id}
                    onClick={onClick}
                    className="hover:brightness-95 active:brightness-90 text-white rounded-2xl p-5 flex flex-col items-start gap-4 transition-all cursor-pointer shadow-sm text-left"
                    style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
                  >
                    <Icon className="w-6 h-6 md:w-5 md:h-5 opacity-90" />
                    <span className="font-bold md:font-semibold text-base md:text-sm leading-snug">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Revenue Chart */}
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-sans font-semibold text-base md:text-sm text-text-primary">Receita · últimos 7 dias</span>
                {revenueGrowth !== null && (
                  <span className={`text-sm md:text-xs font-bold flex items-center gap-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {revenueGrowth >= 0
                      ? <TrendingUp className="w-3.5 h-3.5" />
                      : <TrendingDown className="w-3.5 h-3.5" />
                    }
                    {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(0)}%
                  </span>
                )}
              </div>
              {heroLoading ? (
                <div className="h-[100px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-rose-600" />
                </div>
              ) : (
                <div className="h-[100px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={last7DaysRevData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                      <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                      <Tooltip
                        formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid rgba(180,150,130,0.2)', fontSize: 11 }}
                      />
                      <Line type="monotone" dataKey="Valor" stroke="var(--rose-600)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--rose-600)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* Right column: Próximos clientes */}
          {proximosClientesCard}

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          {shareLinkCard}
          {proximosClientesCard}
        </div>
      )}

      {isStatusInfoOpen && createPortal(
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[300] flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setIsStatusInfoOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[20px] border border-border shadow-2xl w-full max-w-md p-6 md:p-7 relative animate-slide-up"
          >
            <button
              onClick={() => setIsStatusInfoOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-bg text-text-secondary hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-bold tracking-widest text-rose-600 uppercase">
              Como ler os status
            </span>
            <h3 className="font-title font-bold text-2xl text-text-primary mt-1 mb-5 pr-10">
              Próximas clientes
            </h3>

            <div className="space-y-3.5 text-sm">
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Confirmado:</span> o horário está garantido — a aprovação automática está ativa ou você já aprovou manualmente.
              </p>
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Aguardando:</span> a cliente agendou pelo portal e o horário depende da sua aprovação (aparece quando a aprovação manual está ativa em Configurações).
              </p>
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Concluído:</span> o atendimento já foi realizado e o valor entrou no seu faturamento.
              </p>
              <p className="text-text-secondary">
                <span className="font-semibold text-text-primary">Falta:</span> a cliente não compareceu e o não comparecimento ficou registrado no histórico dela.
              </p>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-rose-50/60 border border-rose-100/60">
              <p className="text-xs text-rose-900 leading-relaxed">
                Por padrão, o agendamento entra como <span className="font-semibold">Confirmado</span>. Se você ativar aprovação manual em Configurações, ele entra como <span className="font-semibold">Aguardando</span> até você aprovar ou recusar.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      <TrancarHorarioSheet isOpen={isTrancarOpen} onClose={() => setIsTrancarOpen(false)} />

      <AgendamentoFormSheet
        isOpen={isNovoAgendamentoOpen}
        onClose={() => setIsNovoAgendamentoOpen(false)}
        onSaved={fetchData}
      />

    </div>
  );
}
