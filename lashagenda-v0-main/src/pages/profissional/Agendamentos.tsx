import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import { supabase } from '../../lib/supabase';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  AlertCircle,
  X,
  Clock,
  Coins,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  UserX,
  Lock
} from 'lucide-react';
import type {
  Cliente,
  Servico,
  BloqueioAgenda,
  AgendamentoWithRelations,
} from '../../types';
import { registrarLog } from '../../utils/log';
import ConfirmModal from '../../components/common/ConfirmModal';
import TrancarHorarioSheet from '../../components/common/TrancarHorarioSheet';
import AgendamentoFormSheet from '../../components/common/AgendamentoFormSheet';
import { useAuth } from '../../contexts/AuthContext';

const DIAS_SEMANA = [
  { valor: 0, nome: 'Domingo', sigla: 'Dom' },
  { valor: 1, nome: 'Segunda', sigla: 'Seg' },
  { valor: 2, nome: 'Terça', sigla: 'Ter' },
  { valor: 3, nome: 'Quarta', sigla: 'Qua' },
  { valor: 4, nome: 'Quinta', sigla: 'Qui' },
  { valor: 5, nome: 'Sexta', sigla: 'Sex' },
  { valor: 6, nome: 'Sábado', sigla: 'Sáb' }
];

export default function Agendamentos() {
  const { isProfissional, estabelecimentoId, profile } = useAuth();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<'mensal' | 'semanal' | 'diaria'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 'diaria';
    }
    return 'mensal';
  });
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });

  // Database Data States
  const [workHoursConfig, setWorkHoursConfig] = useState<{ dia_semana: number; hora_inicio: string; hora_fim: string }[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoWithRelations[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);

  const { autoStart } = useOnboarding('agendamentos', { hasPending: agendamentos.some(a => a.status === 'pendente') });
  useEffect(() => { if (profile) autoStart(); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    clientName: string;
    services: string;
    dateStr: string;
    timeStr: string;
    whatsappLink?: string;
    tipo?: 'padrao' | 'conclusao';
    valor?: number;
  } | null>(null);

  // Form / Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [formOpenDate, setFormOpenDate] = useState<Date | undefined>(undefined);
  const [formOpenHour, setFormOpenHour] = useState<string | undefined>(undefined);
  const [preSelectedCliente, setPreSelectedCliente] = useState<Cliente | null>(null);

  // Conclude Modal States
  const [concludeAppt, setConcludeAppt] = useState<AgendamentoWithRelations | null>(null);
  const [concludeUseCustom, setConcludeUseCustom] = useState(false);
  const [concludeCustomValue, setConcludeCustomValue] = useState(0);
  const [concludeSaving, setConcludeSaving] = useState(false);

  // Confirm Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    description: string;
    warningText?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  } | null>(null);

  const openConfirmModal = (config: typeof confirmModalConfig) => {
    setConfirmModalConfig(config);
    setConfirmModalOpen(true);
  };

  // Selected entities for editing/viewing details
  const [selectedAppt, setSelectedAppt] = useState<AgendamentoWithRelations | null>(null);
  const [editingAppt, setEditingAppt] = useState<AgendamentoWithRelations | null>(null);

  const [pendingOpen, setPendingOpen] = useState(() => !!(location.state as { openPending?: boolean })?.openPending);

  // View mode dropdown (toolbar)
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);

  // "Trancar Horário" bottom sheet
  const [isTrancarOpen, setIsTrancarOpen] = useState(false);

  // "Ver Agenda do Dia" from Dashboard: switch to daily view for today
  useEffect(() => {
    const state = location.state as { filterToday?: boolean } | null;
    if (state?.filterToday) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      setCurrentDate(today);
      setViewMode('diaria');
    }
  }, []);

  // "Novo Agendamento" from PerfilCliente: open modal with client pre-selected
  useEffect(() => {
    const state = location.state as { novoAgendamento?: boolean; clientePreSelecionado?: Cliente } | null;
    if (state?.novoAgendamento && state.clientePreSelecionado) {
      setEditingAppt(null);
      setFormOpenDate(undefined);
      setFormOpenHour(undefined);
      setPreSelectedCliente(state.clientePreSelecionado);
      setIsModalOpen(true);
      window.history.replaceState({}, '');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [rejectModalAppt, setRejectModalAppt] = useState<AgendamentoWithRelations | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState('');
  const [rejectSaving, setRejectSaving] = useState(false);
  const rejectSavingRef = useRef(false);

  const [approveModalAppt, setApproveModalAppt] = useState<AgendamentoWithRelations | null>(null);
  const [approveSaving, setApproveSaving] = useState(false);
  const approveSavingRef = useRef(false);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 6000);
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const showSuccessFeedback = (appt: { data_hora: string; cliente?: { nome: string; sobrenome?: string | null; whatsapp?: string | null } | null; agendamento_servicos?: { servico?: { nome: string } }[] }, isNew: boolean, externalWhatsappLink?: string) => {
    const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
    const dateObj = new Date(appt.data_hora);
    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const servicesList = appt.agendamento_servicos?.map(s => s.servico?.nome).join(', ') || 'Procedimento';

    // Se vier um link externo (ex: do fluxo de aprovação), usa ele; senão monta um genérico
    let whatsappLink = externalWhatsappLink;
    if (!whatsappLink) {
      const phoneDigits = appt.cliente?.whatsapp ? appt.cliente.whatsapp.replace(/\D/g, '') : '';
      if (phoneDigits) {
        const message = `Olá, ${appt.cliente?.nome || 'cliente'}! Seu agendamento para *${servicesList}* no dia *${dateStr}* às *${timeStr}* está confirmado. Te aguardamos! \u{1F497}`;
        whatsappLink = `https://wa.me/55${phoneDigits}?text=${encodeURIComponent(message)}`;
      }
    }

    setSuccessModal({
      isOpen: true,
      title: isNew ? 'Agendamento Cadastrado!' : 'Agendamento Confirmado!',
      clientName,
      services: servicesList,
      dateStr,
      timeStr,
      whatsappLink
    });
  };

  // Fetch initial configuration data
  const fetchSetupData = async () => {
    if (!estabelecimentoId) return;
    try {
      const [horariosRes, srvsRes, bloqRes] = await Promise.all([
        supabase.from('horarios_atendimento').select('dia_semana, hora_inicio, hora_fim').eq('estabelecimento_id', estabelecimentoId),
        supabase.from('servicos').select('*').eq('estabelecimento_id', estabelecimentoId).order('nome'),
        supabase.from('bloqueios_agenda').select('*').eq('estabelecimento_id', estabelecimentoId)
      ]);
      if (horariosRes.error) throw horariosRes.error;
      if (srvsRes.error) throw srvsRes.error;
      if (bloqRes.error) throw bloqRes.error;
      setWorkHoursConfig(horariosRes.data || []);
      setServicos(srvsRes.data || []);
      setBloqueios(bloqRes.data || []);
    } catch (err) {
      console.error('Erro de setup:', err);
      showTemporaryError('Falha ao carregar catálogo de serviços.');
    }
  };

  // Fetch appointments (including cancelled ones now)
  const fetchAppointments = async () => {
    if (!estabelecimentoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:clientes(id, nome, sobrenome, whatsapp),
          agendamento_servicos(
            servico_id,
            variacao_id,
            valor_cobrado,
            servico:servicos(nome),
            variacao:variacoes_servico(nome)
          )
        `)
        .eq('estabelecimento_id', estabelecimentoId);

      if (error) throw error;
      setAgendamentos(data || []);
      
      // Update currently viewed detail if it is open (so status or services update on screen)
      if (selectedAppt) {
        const updated = (data || []).find(a => a.id === selectedAppt.id);
        if (updated) {
          setSelectedAppt(updated);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
      showTemporaryError('Erro ao carregar calendário.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estabelecimentoId) {
      fetchSetupData();
      fetchAppointments();
    }
  }, [estabelecimentoId]);

  // Date helper functions
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day; // day 0 = Sunday
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getDaysOfWeek = (d: Date) => {
    const start = getStartOfWeek(d);
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      day.setHours(12, 0, 0, 0);
      return day;
    });
  };

  const getDaysOfMonthGrid = (d: Date) => {
    const startMonth = new Date(d.getFullYear(), d.getMonth(), 1, 12, 0, 0, 0);
    const startDayOfWeek = startMonth.getDay(); // 0-6
    const gridStart = new Date(startMonth);
    gridStart.setDate(startMonth.getDate() - startDayOfWeek); // Backtrack to Sunday
    
    return Array.from({ length: 42 }, (_, i) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      day.setHours(12, 0, 0, 0);
      return day;
    });
  };

  // DATE NAVIGATION
  const handleNavigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      setCurrentDate(today);
      return;
    }

    const value = direction === 'next' ? 1 : -1;
    const nextD = new Date(currentDate);

    if (viewMode === 'mensal') {
      nextD.setMonth(currentDate.getMonth() + value);
    } else if (viewMode === 'semanal') {
      nextD.setDate(currentDate.getDate() + value * 7);
    } else {
      nextD.setDate(currentDate.getDate() + value);
    }
    setCurrentDate(nextD);
  };

  // OPEN MODAL FOR NEW APPOINTMENT (FROM SLOT OR BUTTON)
  const handleOpenForm = (date?: Date, hourStr?: string) => {
    setEditingAppt(null);
    setPreSelectedCliente(null);
    setFormOpenDate(date);
    setFormOpenHour(hourStr);
    setIsModalOpen(true);
  };

  // OPEN EDIT FORM
  const handleOpenEditForm = (appt: AgendamentoWithRelations) => {
    setIsDetailOpen(false);
    setEditingAppt(appt);
    setIsModalOpen(true);
  };

  // OPEN DETAILS MODAL
  const handleOpenDetail = (appt: AgendamentoWithRelations) => {
    setSelectedAppt(appt);
    setIsDetailOpen(true);
  };

  // SAVE APPOINTMENT (CREATE OR EDIT) — mantido só pra referência de qual bloco remover a seguir
  const openWhatsApp = (appt: AgendamentoWithRelations, tipo: 'aprovado' | 'recusado', motivo?: string) => {
    const whatsapp = appt.cliente?.whatsapp;
    if (!whatsapp) return;
    const phone = '55' + whatsapp.replace(/\D/g, '');
    const apptDate = new Date(appt.data_hora);
    const dateStr = apptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeStr = apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const servicos = appt.agendamento_servicos?.map(s => s.servico?.nome).filter(Boolean).join(', ') || '';
    const firstName = appt.cliente?.nome || 'cliente';
    let msg: string;
    if (tipo === 'aprovado') {
      msg = `Olá ${firstName}! \u{1F389} Seu agendamento foi *confirmado*!\n\n\u{1F4C5} *Data:* ${dateStr}\n\u{1F550} *Horário:* ${timeStr}\n\u{1F486} *Serviço:* ${servicos}\n\nTe esperamos! \u{1F60A}`;
    } else {
      const motivoLinha = motivo?.trim() ? `\n\n_${motivo.trim()}_` : '';
      msg = `Olá ${firstName}! Infelizmente precisamos recusar seu agendamento de *${dateStr} às ${timeStr}*.${motivoLinha}\n\nEntre em contato para reagendarmos. \u{1F497}`;
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleOpenRejectModal = (appt: AgendamentoWithRelations) => {
    setRejectMotivo('');
    setRejectModalAppt(appt);
  };

  const handleRejectConfirm = async (sendWhatsApp: boolean) => {
    if (!rejectModalAppt || rejectSavingRef.current) return;
    rejectSavingRef.current = true;

    // window.open ANTES de qualquer await — único jeito de funcionar no iOS Safari
    const waUrl = sendWhatsApp ? openWhatsApp(rejectModalAppt, 'recusado', rejectMotivo) : undefined;
    if (waUrl) window.open(waUrl, '_blank');

    setRejectSaving(true);
    const appt = rejectModalAppt;
    const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'cancelado' })
        .eq('id', appt.id)
        .eq('estabelecimento_id', estabelecimentoId);
      if (error) throw error;
      await registrarLog('editou', 'agendamento', appt.id, `Recusou agendamento de "${clientName}"`);
      setRejectModalAppt(null);
      setIsDetailOpen(false);
      fetchAppointments();
      const dateObj = new Date(appt.data_hora);
      setSuccessModal({
        isOpen: true,
        title: 'Agendamento Recusado',
        clientName: clientName,
        services: appt.agendamento_servicos?.map(s => s.servico?.nome).join(', ') || '—',
        dateStr: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        timeStr: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        whatsappLink: undefined,
      });
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao recusar agendamento.');
    } finally {
      rejectSavingRef.current = false;
      setRejectSaving(false);
    }
  };

  const handleOpenApproveModal = (appt: AgendamentoWithRelations) => {
    setApproveModalAppt(appt);
  };

  const handleApproveConfirm = async (sendWhatsApp: boolean) => {
    if (!approveModalAppt || approveSavingRef.current) return;
    approveSavingRef.current = true;

    // window.open ANTES de qualquer await — único jeito de funcionar no iOS Safari
    if (sendWhatsApp) {
      const waUrl = openWhatsApp(approveModalAppt, 'aprovado');
      if (waUrl) window.open(waUrl, '_blank');
    }

    setApproveSaving(true);
    const appt = approveModalAppt;
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'confirmado' })
        .eq('id', appt.id)
        .eq('estabelecimento_id', estabelecimentoId);
      if (error) throw error;
      const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
      await registrarLog('editou', 'agendamento', appt.id, `Confirmou agendamento de "${clientName}"`);
      setApproveModalAppt(null);
      setIsDetailOpen(false);
      fetchAppointments();
      showSuccessFeedback(appt, false);
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao confirmar agendamento.');
    } finally {
      approveSavingRef.current = false;
      setApproveSaving(false);
    }
  };

  // Open the conclude modal (instead of the generic confirm)
  const handleOpenConcludeModal = (appt: AgendamentoWithRelations) => {
    const total = appt.agendamento_servicos?.reduce((sum, s) => sum + Number(s.valor_cobrado || 0), 0) || 0;
    setConcludeAppt(appt);
    setConcludeUseCustom(false);
    setConcludeCustomValue(total);
    setConcludeSaving(false);
  };

  // Confirm conclusion: save status + valor_cobrado
  const handleConcludeConfirm = async () => {
    if (!concludeAppt) return;
    const appt = concludeAppt;
    const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
    const totalServicos = appt.agendamento_servicos?.reduce((sum, s) => sum + Number(s.valor_cobrado || 0), 0) || 0;
    const valorFinal = concludeUseCustom ? concludeCustomValue : totalServicos;

    setConcludeSaving(true);
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: 'concluido', valor_cobrado: valorFinal })
        .eq('id', appt.id)
        .eq('estabelecimento_id', estabelecimentoId);

      if (error) throw error;

      const desconto = concludeUseCustom ? ` com valor recebido de R$ ${valorFinal.toFixed(2)}` : '';
      await registrarLog(
        'editou',
        'agendamento',
        appt.id,
        `Concluiu atendimento de "${clientName}"${desconto}`
      );

      setConcludeAppt(null);
      setIsDetailOpen(false);
      const dateObj = new Date(appt.data_hora);
      setSuccessModal({
        isOpen: true,
        tipo: 'conclusao',
        title: 'Atendimento Concluído!',
        clientName: clientName,
        services: appt.agendamento_servicos?.map(s => s.servico?.nome).join(', ') || '—',
        dateStr: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        timeStr: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        valor: valorFinal,
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao concluir atendimento.');
    } finally {
      setConcludeSaving(false);
    }
  };

  const handleChangeStatus = async (appt: AgendamentoWithRelations, newStatus: 'cancelado' | 'concluido') => {
    if (newStatus === 'concluido') {
      handleOpenConcludeModal(appt);
      return;
    }

    const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
    
    openConfirmModal({
      title: 'Cancelar Agendamento?',
      description: `Tem certeza que deseja cancelar o agendamento de "${clientName}"?`,
      confirmText: 'Cancelar Agendamento',
      cancelText: 'Voltar',
      type: 'warning',
      onConfirm: async () => {
        // Abre WhatsApp ANTES de qualquer await para manter contexto de gesto (iOS)
        const waUrl = appt.status === 'pendente' ? openWhatsApp(appt, 'recusado') : undefined;
        if (waUrl) window.open(waUrl, '_blank');

        try {
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: newStatus })
            .eq('id', appt.id)
            .eq('estabelecimento_id', estabelecimentoId);

          if (error) throw error;

          await registrarLog(
            'editou',
            'agendamento',
            appt.id,
            `Alterou status do agendamento de "${clientName}" para "${newStatus}"`
          );

          setIsDetailOpen(false);
          showTemporarySuccess(`Agendamento cancelado!`);
          fetchAppointments();
        } catch (err) {
          console.error(err);
          showTemporaryError(`Falha ao alterar status do agendamento.`);
        }
      }
    });
  };

  const handleDeleteAppointment = async (appt: AgendamentoWithRelations) => {
    const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
    
    openConfirmModal({
      title: 'Excluir Agendamento?',
      description: `Tem certeza que deseja excluir permanentemente o agendamento de "${clientName}"?`,
      warningText: 'Esta ação é permanente e não pode ser desfeita.',
      confirmText: 'Excluir',
      type: 'danger',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', appt.id)
            .eq('estabelecimento_id', estabelecimentoId);

          if (error) throw error;

          await registrarLog('excluiu', 'agendamento', appt.id, `Excluiu permanentemente agendamento de "${clientName}"`);

          setIsDetailOpen(false);
          const dateObj = new Date(appt.data_hora);
          setSuccessModal({
            isOpen: true,
            title: 'Agendamento Excluído',
            clientName,
            services: appt.agendamento_servicos?.map(s => s.servico?.nome).join(', ') || '—',
            dateStr: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            timeStr: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          });
          fetchAppointments();
        } catch (err) {
          console.error(err);
          showTemporaryError('Falha ao excluir agendamento.');
        }
      }
    });
  };

  const handleMarkNoShow = (appt: AgendamentoWithRelations) => {
    const clientName = appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente';
    openConfirmModal({
      title: 'Registrar Falta?',
      description: `Confirma que "${clientName}" não compareceu ao agendamento sem aviso prévio?`,
      warningText: 'Esta falta será registrada no histórico da cliente.',
      confirmText: 'Registrar Falta',
      cancelText: 'Voltar',
      type: 'warning',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('agendamentos')
            .update({ status: 'falta' })
            .eq('id', appt.id)
            .eq('estabelecimento_id', estabelecimentoId);
          if (error) throw error;
          await registrarLog('editou', 'agendamento', appt.id, `Registrou falta de "${clientName}" no agendamento`);
          setIsDetailOpen(false);
          const dateObj = new Date(appt.data_hora);
          setSuccessModal({
            isOpen: true,
            title: 'Falta Registrada',
            clientName: appt.cliente ? `${appt.cliente.nome} ${appt.cliente.sobrenome || ''}`.trim() : 'Cliente',
            services: appt.agendamento_servicos?.map(s => s.servico?.nome).join(', ') || '—',
            dateStr: dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            timeStr: dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            whatsappLink: undefined,
          });
          fetchAppointments();
        } catch (err) {
          console.error(err);
          showTemporaryError('Falha ao registrar falta.');
        }
      }
    });
  };

  // Visual status mapper for calendar blocks
  const getStatusColorStyles = (status: string = 'confirmado') => {
    switch (status) {
      case 'cancelado':
        return { border: 'border-gray-200', bg: 'bg-gray-100 hover:bg-gray-200 text-gray-400 line-through opacity-50', badge: 'bg-gray-200 text-gray-600', text: 'text-gray-500' };
      case 'concluido':
        return { border: 'border-blue-300', bg: 'bg-blue-50 hover:bg-blue-100 text-blue-800', badge: 'bg-blue-200 text-blue-950', text: 'text-blue-900' };
      case 'pendente':
        return { border: 'border-amber-300', bg: 'bg-amber-50 hover:bg-amber-100 text-amber-800', badge: 'bg-amber-200 text-amber-900', text: 'text-amber-900' };
      case 'falta':
        return { border: 'border-red-400', bg: 'bg-red-50 hover:bg-red-100 text-red-800 opacity-70', badge: 'bg-red-200 text-red-900', text: 'text-red-900' };
      default: // confirmado
        return { border: 'border-green-300', bg: 'bg-green-50 hover:bg-green-100 text-green-800', badge: 'bg-green-200 text-green-900', text: 'text-green-900' };
    }
  };

  // Calendar parameters
  // Faixa de horas exibida na régua do calendário: em vez de fixa, é calculada
  // a partir do expediente configurado em Meus Horários (menor hora_inicio e
  // maior hora_fim entre os dias ativos), pra nunca cortar um agendamento que
  // caia fora do intervalo 08:00-20:00 padrão. Sem expediente configurado,
  // mantém o fallback de 08:00-20:00.
  const { startHour, endHour } = useMemo(() => {
    const DEFAULT_START = 8;
    const DEFAULT_END = 20;
    if (workHoursConfig.length === 0) return { startHour: DEFAULT_START, endHour: DEFAULT_END };

    const toMinutos = (hhmm: string) => {
      const [h, m] = hhmm.substring(0, 5).split(':').map(Number);
      return h * 60 + m;
    };

    const minInicio = Math.min(...workHoursConfig.map(h => toMinutos(h.hora_inicio)));
    const maxFim = Math.max(...workHoursConfig.map(h => toMinutos(h.hora_fim)));

    return {
      startHour: Math.floor(minInicio / 60),
      endHour: Math.ceil(maxFim / 60),
    };
  }, [workHoursConfig]);

  const halfHourSlots = Array.from({ length: (endHour - startHour) * 2 }, (_, i) => ({
    hour: startHour + Math.floor(i / 2),
    minute: (i % 2) * 30,
  }));
  // Altura de cada slot de 30min na visualização diária (ajuste incremental
  // pedido pra deixar as linhas mais "respiradas", como no app de referência).
  const DAY_SLOT_HEIGHT = 40;

  const formatDateStr = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Availability validation using global horarios_atendimento and bloqueios
  const isHourAvailable = (date: Date, hour: number, minute = 0) => {
    const ds = formatDateStr(date);

    const isFullDayBlocked = bloqueios.some(b => b.dia_inteiro !== false && ds >= b.data_inicio && ds <= b.data_fim);
    if (isFullDayBlocked) return false;

    const hh = hour.toString().padStart(2, '0');
    const mm = minute.toString().padStart(2, '0');
    const slotStrStart = `${hh}:${mm}:00`;
    const endTotal = hour * 60 + minute + 30;
    const slotStrEnd = `${Math.floor(endTotal / 60).toString().padStart(2, '0')}:${(endTotal % 60).toString().padStart(2, '0')}:00`;

    const isSlotBlocked = bloqueios.some(b => {
      if (b.dia_inteiro === false && b.hora_inicio && b.hora_fim && ds >= b.data_inicio && ds <= b.data_fim) {
        return slotStrStart < b.hora_fim && slotStrEnd > b.hora_inicio;
      }
      return false;
    });
    if (isSlotBlocked) return false;

    if (workHoursConfig.length === 0) return true;
    const dayOfWeek = date.getDay();
    const sched = workHoursConfig.find(h => h.dia_semana === dayOfWeek);
    if (!sched) return false;
    return slotStrStart >= sched.hora_inicio && slotStrStart < sched.hora_fim;
  };

  const visibleAppointments = agendamentos;
  const pendingAppts = agendamentos
    .filter(a => a.status === 'pendente')
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  return (
    <div className="space-y-6">
      {/* Floating Toasts */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4 pointer-events-none">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg animate-fade-in pointer-events-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-lg px-4 pointer-events-none">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg animate-fade-in pointer-events-auto">
            <Sparkles className="w-5 h-5 flex-shrink-0 text-green-600" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Control Header Box */}
      <div
        className="rounded-[14px] p-5 shadow-sm space-y-4 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Title & Navigation */}
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-title font-semibold text-3xl md:text-2xl">Agendamentos</h2>

              <div className="flex items-center bg-white/15 backdrop-blur-sm rounded-lg p-0.5 border border-white/20">
                <button
                  onClick={() => handleNavigateDate('prev')}
                  className="p-2 md:p-1.5 hover:bg-white/20 rounded-md transition-all text-white/80 hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => handleNavigateDate('today')}
                  className="px-3.5 py-1.5 md:px-3 md:py-1 text-sm md:text-xs font-semibold hover:bg-white/20 rounded-md transition-all text-white/80 hover:text-white cursor-pointer"
                >
                  Hoje
                </button>
                <button
                  onClick={() => handleNavigateDate('next')}
                  className="p-2 md:p-1.5 hover:bg-white/20 rounded-md transition-all text-white/80 hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>

            <span className="font-title font-medium text-xl md:text-lg text-white/80">
              {viewMode === 'diaria' && currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              {viewMode === 'semanal' && `Semana de ${getStartOfWeek(currentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
              {viewMode === 'mensal' && currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar de ações rápidas — Novo Agendamento / Trancar Horário / Visualização */}
      <div className="flex items-center gap-2">
        <button
          id="ob-agend-novo-btn"
          onClick={() => handleOpenForm(currentDate)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3.5 md:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full md:rounded-lg text-sm md:text-xs font-bold md:font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Novo Agendamento</span>
          <span className="sm:hidden">Novo</span>
        </button>

        <button
          onClick={() => setIsTrancarOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-3.5 md:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full md:rounded-lg text-sm md:text-xs font-bold md:font-semibold shadow-sm transition-colors cursor-pointer"
        >
          <Lock className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Trancar Horário</span>
          <span className="sm:hidden">Trancar</span>
        </button>

        <div className="relative flex-1">
          <button
            id="ob-agend-view-toggle"
            onClick={() => setViewDropdownOpen(o => !o)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-3.5 md:py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full md:rounded-lg text-sm md:text-xs font-bold md:font-semibold shadow-sm transition-colors cursor-pointer"
          >
            {viewMode === 'diaria' && 'Dia'}
            {viewMode === 'semanal' && 'Semana'}
            {viewMode === 'mensal' && 'Mês'}
            <ChevronDown className={`w-4 h-4 md:w-3.5 md:h-3.5 transition-transform duration-200 ${viewDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {viewDropdownOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setViewDropdownOpen(false)} />
              <div className="absolute right-0 mt-1.5 w-40 md:w-36 bg-white rounded-lg shadow-lg border border-border overflow-hidden z-30 animate-fade-in">
                {[
                  { id: 'diaria', label: 'Dia' },
                  { id: 'semanal', label: 'Semana' },
                  { id: 'mensal', label: 'Mês' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => { setViewMode(mode.id as any); setViewDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-3 md:py-2.5 text-sm md:text-xs font-semibold transition-colors cursor-pointer ${
                      viewMode === mode.id ? 'bg-rose-50 text-rose-600' : 'text-text-secondary hover:bg-bg'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending Appointments Panel */}
      {pendingAppts.length > 0 && (
        <div id="ob-agend-pendentes" className="bg-white border border-amber-200 rounded-[14px] shadow-sm overflow-hidden">
          <button
            onClick={() => setPendingOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-amber-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 md:w-4 md:h-4 text-amber-500" />
              <span className="font-title font-semibold text-lg md:text-base text-text-primary">Aguardando confirmação</span>
              <span className="bg-amber-100 text-amber-700 border border-amber-200 text-sm md:text-xs font-bold px-2.5 py-1 md:px-2 md:py-0.5 rounded-full">
                {pendingAppts.length}
              </span>
            </div>
            <ChevronDown className={`w-5 h-5 md:w-4 md:h-4 text-text-secondary transition-transform duration-200 ${pendingOpen ? 'rotate-180' : ''}`} />
          </button>

          {pendingOpen && (
            <div className="border-t border-amber-100 divide-y divide-border/40">
              {pendingAppts.map(appt => {
                const apptDate = new Date(appt.data_hora);
                const dateLabel = apptDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
                const timeLabel = apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const servicos = appt.agendamento_servicos?.map(s => s.servico?.nome).filter(Boolean).join(', ') || '—';
                return (
                  <div key={appt.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-base md:text-sm text-text-primary truncate">
                          {appt.cliente?.nome} {appt.cliente?.sobrenome}
                        </p>
                        <p className="text-sm md:text-xs text-text-secondary mt-0.5">{dateLabel} às {timeLabel}</p>
                      </div>
                      <p className="text-sm md:text-xs text-text-muted truncate hidden sm:block">{servicos}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenApproveModal(appt)}
                        className="flex items-center gap-1 px-3.5 py-2 md:px-3 md:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm md:text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleOpenRejectModal(appt)}
                        className="flex items-center gap-1 px-3.5 py-2 md:px-3 md:py-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-sm md:text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 md:w-3.5 md:h-3.5" />
                        Recusar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CALENDAR BODY */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 text-text-secondary bg-surface border rounded-[14px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
          <p className="text-sm">Carregando calendário...</p>
        </div>
      ) : (
        /* VISUALIZAÇÃO SEMANAL */
        viewMode === 'semanal' && (
          <div id="ob-agend-grid" className="bg-white border border-border rounded-[14px] overflow-hidden shadow-sm flex flex-col">
            {/* Grid Header */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-rose-50/10 text-center">
              <div className="py-3 border-r border-border" />
              {getDaysOfWeek(currentDate).map(day => {
                const isToday = new Date().toDateString() === day.toDateString();
                return (
                  <div key={day.toISOString()} className={`py-3 border-r border-border flex flex-col items-center justify-center gap-0.5 last:border-r-0 ${isToday ? 'bg-rose-50/40' : ''}`}>
                    <span className="text-xs md:text-[10px] font-bold text-text-secondary uppercase tracking-wider">{DIAS_SEMANA[day.getDay()].sigla}</span>
                    <span className={`w-8 h-8 md:w-7 md:h-7 flex items-center justify-center rounded-full text-base md:text-sm font-semibold font-title ${isToday ? 'bg-rose-600 text-white shadow-sm' : 'text-text-primary'}`}>
                      {day.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-[60px_repeat(7,1fr)] h-[720px] overflow-y-auto relative bg-bg/5">

              {/* Hour slot labels */}
              <div className="border-r border-border bg-white text-right pr-2 text-[10px] font-bold text-text-secondary select-none">
                {halfHourSlots.map(({ hour, minute }) => (
                  <div key={`${hour}-${minute}`} className={`h-[30px] border-b border-border/50 flex items-center justify-end pr-1 ${minute === 0 ? 'font-bold' : 'font-normal text-[8px] text-text-muted/60'}`}>
                    <span>{hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}</span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {getDaysOfWeek(currentDate).map(day => {
                const dayAppts = visibleAppointments.filter(appt => {
                  const apptDate = new Date(appt.data_hora);
                  return apptDate.toDateString() === day.toDateString();
                });

                return (
                  <div key={day.toISOString()} className="relative border-r border-border last:border-r-0 h-full group">
                    {/* Half-hour slots background */}
                    {halfHourSlots.map(({ hour, minute }) => {
                      const isAvailable = isHourAvailable(day, hour, minute);
                      return (
                        <div
                          key={`${hour}-${minute}`}
                          onClick={() => isAvailable && handleOpenForm(day, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)}
                          className={`h-[30px] transition-colors cursor-pointer flex items-center justify-center
                            ${minute === 30 ? 'border-b border-border/50' : ''}
                            ${isAvailable ? 'hover:bg-rose-50/30' : 'bg-gray-100/55 cursor-not-allowed text-text-muted/40 font-semibold text-[10px]'}`}
                          title={isAvailable ? 'Clique para agendar' : 'Horário indisponível / Fechado'}
                        >
                          {!isAvailable && minute === 0 && '🔒'}
                        </div>
                      );
                    })}

                    {/* Absolute Blocks */}
                    {dayAppts.map(appt => {
                      const apptDate = new Date(appt.data_hora);
                      const startHourVal = apptDate.getHours() + apptDate.getMinutes() / 60;
                      const top = (startHourVal - startHour) * 60;
                      const height = (appt.duracao_minutos / 60) * 60;
                      const colors = getStatusColorStyles(appt.status);
                      const weekAccentBorder =
                        appt.status === 'cancelado' ? 'border-l-gray-400' :
                        appt.status === 'concluido' ? 'border-l-blue-500' :
                        appt.status === 'pendente' ? 'border-l-amber-500' :
                        appt.status === 'falta' ? 'border-l-red-500' :
                        'border-l-green-500';
                      return (
                        <div
                          key={appt.id}
                          style={{ top: `${top}px`, height: `${height}px` }}
                          onClick={(e) => { e.stopPropagation(); handleOpenDetail(appt); }}
                          className={`absolute left-1 right-1 rounded-lg border border-l-[3px] overflow-hidden flex flex-col shadow-sm cursor-pointer z-10 transition-all ${colors.border} ${weekAccentBorder} ${colors.bg} ${height < 45 ? 'px-1 py-[2px]' : 'px-2 py-1'}`}
                          title={`${appt.cliente?.nome} ${appt.cliente?.sobrenome || ''} — ${appt.agendamento_servicos?.map(s => s.servico?.nome || servicos.find(ls => ls.id === s.servico_id)?.nome).filter(Boolean).join(', ')}`}
                        >
                          <div className="flex items-start justify-between gap-1 min-h-0">
                            <p className={`font-bold truncate flex-1 leading-none ${height < 45 ? 'text-[9px]' : 'text-[10px] leading-tight'}`}>{appt.cliente?.nome} {appt.cliente?.sobrenome}</p>
                            <span className={`opacity-70 whitespace-nowrap flex-shrink-0 leading-none ${height < 45 ? 'text-[8px]' : 'text-[9px]'}`}>
                              {apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {height >= 28 && (
                            <p className={`opacity-75 truncate mt-1 leading-none ${height < 45 ? 'text-[8px]' : 'text-[9px] leading-tight'}`}>
                              {appt.agendamento_servicos?.map(s => s.servico?.nome || servicos.find(ls => ls.id === s.servico_id)?.nome).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}

      {/* VISUALIZAÇÃO DIÁRIA */}
      {!loading && viewMode === 'diaria' && (
        <div id="ob-agend-grid" className="bg-white border border-border rounded-[14px] overflow-hidden shadow-sm flex flex-col">
          <div className="grid grid-cols-[60px_1fr] border-b border-border bg-rose-50/10 text-center">
            <div className="py-3 border-r border-border" />
            <div className="py-3 flex items-center justify-center gap-1.5 font-title font-semibold text-xl md:text-lg text-text-primary">
              <CalendarDays className="w-6 h-6 md:w-5 md:h-5 text-rose-600" />
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-[60px_1fr] h-[720px] overflow-y-auto relative bg-bg/5">
            {/* Hours Labels */}
            <div className="border-r border-border bg-white text-right pr-2 text-[10px] font-bold text-text-secondary select-none">
              {halfHourSlots.map(({ hour, minute }) => (
                <div key={`${hour}-${minute}`} style={{ height: DAY_SLOT_HEIGHT }} className={`border-b border-border/50 flex items-center justify-end pr-1 ${minute === 0 ? 'font-bold text-xs' : 'font-normal text-[8px] text-text-muted/60'}`}>
                  <span>{hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}</span>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative h-full">
              {halfHourSlots.map(({ hour, minute }) => {
                const isAvailable = isHourAvailable(currentDate, hour, minute);
                return (
                  <div
                    key={`${hour}-${minute}`}
                    style={{ height: DAY_SLOT_HEIGHT }}
                    onClick={() => isAvailable && handleOpenForm(currentDate, `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)}
                    className={`relative transition-colors cursor-pointer flex items-center justify-center
                      ${minute === 30 ? 'border-b border-border/50' : ''}
                      ${isAvailable ? 'hover:bg-rose-50/30' : 'bg-gray-100/55 cursor-not-allowed text-text-muted/40'}`}
                  >
                    {!isAvailable && minute === 0 && (
                      <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 pointer-events-none">🔒</span>
                    )}
                  </div>
                );
              })}

              {/* Render Appointments */}
              {visibleAppointments
                .filter(appt => new Date(appt.data_hora).toDateString() === currentDate.toDateString())
                .map(appt => {
                  const apptDate = new Date(appt.data_hora);
                  const startHourVal = apptDate.getHours() + apptDate.getMinutes() / 60;
                  const top = (startHourVal - startHour) * DAY_SLOT_HEIGHT * 2;
                  const height = (appt.duracao_minutos / 60) * DAY_SLOT_HEIGHT * 2;
                  const colors = getStatusColorStyles(appt.status);

                  // Accent left border por status (inspirado no layout de referência)
                  const accentBorder =
                    appt.status === 'cancelado' ? 'border-l-gray-400' :
                    appt.status === 'concluido' ? 'border-l-blue-500' :
                    appt.status === 'pendente' ? 'border-l-amber-500' :
                    appt.status === 'falta' ? 'border-l-red-500' :
                    'border-l-green-500';

                  return (
                    <div
                      key={appt.id}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      onClick={() => handleOpenDetail(appt)}
                      className={`absolute left-2 right-2 rounded-lg border border-l-[4px] overflow-hidden flex flex-col shadow-sm cursor-pointer z-10 transition-all ${colors.border} ${accentBorder} ${colors.bg} ${height < 40 ? 'px-2 py-0.5' : height < 70 ? 'px-2.5 py-1' : 'px-3 py-1.5'}`}
                    >
                      {/* Linha 1: Nome + Horário — destacados, são o que mais importa escanear rápido */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold truncate flex-1 leading-tight text-base">
                          {appt.cliente?.nome} {appt.cliente?.sobrenome}
                        </p>
                        <span className={`font-bold opacity-90 whitespace-nowrap flex-shrink-0 leading-none ${height < 40 ? 'text-[10px]' : height < 70 ? 'text-xs' : 'text-sm'}`}>
                          {apptDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {/* Linha 2: Serviço — em agendamentos muito curtos (<40min) fica de fora pra
                          não espremer o nome; a partir daí sempre exibida, tamanho mais discreto */}
                      {height >= 40 && (
                        <p className={`opacity-75 truncate leading-none ${height < 70 ? 'text-[10px] mt-0.5' : 'text-xs mt-1'}`}>
                          {appt.agendamento_servicos?.map(s => s.servico?.nome || servicos.find(ls => ls.id === s.servico_id)?.nome).filter(Boolean).join(', ')}
                          {height >= 70 && appt.observacoes && (
                            <span className="opacity-60 italic ml-1">· {appt.observacoes}</span>
                          )}
                        </p>
                      )}
                      {/* Linha 3: Duração e Status */}
                      {height >= 60 && (
                        <div className="flex items-center justify-between mt-auto w-full text-[10px]">
                          {height >= 70 ? (
                            <p className="text-[10px] opacity-50 font-medium leading-none">
                              {appt.duracao_minutos} min
                            </p>
                          ) : (
                            <span />
                          )}
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border leading-none ${
                            appt.status === 'cancelado' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                            appt.status === 'concluido' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            appt.status === 'pendente' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            appt.status === 'falta' ? 'bg-red-100 text-red-800 border-red-200' :
                            'bg-green-100 text-green-800 border-green-200'
                          }`}>
                            {appt.status === 'confirmado' ? 'Confirmado' :
                             appt.status === 'pendente' ? 'Pendente' :
                             appt.status === 'concluido' ? 'Concluído' :
                             appt.status === 'cancelado' ? 'Cancelado' :
                             appt.status === 'falta' ? 'Falta' : appt.status}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* VISUALIZAÇÃO MENSAL */}
      {!loading && viewMode === 'mensal' && (
        <div id="ob-agend-grid" className="bg-white border border-border rounded-[14px] overflow-hidden shadow-sm flex flex-col">
          <div className="grid grid-cols-7 border-b border-border bg-rose-50/10 text-center text-sm md:text-xs font-bold text-text-secondary py-3">
            {DIAS_SEMANA.map(d => (
              <span key={d.valor}>{d.nome}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 grid-rows-6 h-[550px] bg-bg/5 divide-x divide-y divide-border">
            {getDaysOfMonthGrid(currentDate).map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isToday = new Date().toDateString() === day.toDateString();
              const activeBlock = bloqueios.find(b => {
                const ds = formatDateStr(day);
                return b.dia_inteiro !== false && ds >= b.data_inicio && ds <= b.data_fim;
              });
              const isDayClosed = (workHoursConfig.length > 0 && !workHoursConfig.some(h => h.dia_semana === day.getDay())) || !!activeBlock;
              
              const dayAppts = visibleAppointments.filter(appt => 
                new Date(appt.data_hora).toDateString() === day.toDateString()
              );

              return (
                <div 
                  key={idx}
                  onClick={() => !isDayClosed && handleOpenForm(day)}
                  className={`p-2 flex flex-col justify-between overflow-hidden transition-all ${
                    isDayClosed 
                      ? 'bg-gray-100/50 cursor-not-allowed text-text-muted/40' 
                      : `cursor-pointer hover:bg-rose-50/20 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/40'}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-rose-600 text-white font-bold' : 'text-text-secondary'}`}>
                      {day.getDate()}
                    </span>
                    {isDayClosed && (
                      <span className="text-[10px] text-text-muted" title={activeBlock ? `Bloqueado: ${activeBlock.motivo || 'Folga'}` : "Dia Fechado"}>🔒</span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1 mt-1.5">
                    {dayAppts.slice(0, 3).map(appt => {
                      const colors = getStatusColorStyles(appt.status);
                      return (
                        <div 
                          key={appt.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(appt);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-semibold border truncate transition-all ${colors.border} ${colors.bg}`}
                          title={`${appt.cliente?.nome}: ${appt.agendamento_servicos?.map(s => s.servico?.nome).join(', ')}`}
                        >
                          {new Date(appt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {appt.cliente?.nome}
                        </div>
                      );
                    })}
                    {dayAppts.length > 3 && (
                      <div className="text-[8px] text-rose-600 font-bold text-center">
                        + {dayAppts.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETAIL MODAL / PANEL */}
      {isDetailOpen && selectedAppt && createPortal(
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-md flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-slide-up">
            
            {/* Header */}
            <div className="bg-gradient-to-br from-rose-600 to-rose-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h4 className="font-title font-bold text-xl md:text-lg text-white">
                Detalhes do Agendamento
              </h4>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-rose-200 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">

              {/* Client Info (Link to Profile) */}
              <div className="bg-rose-50/20 border border-border/80 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-xs md:text-[9px] font-bold text-text-secondary uppercase tracking-wider">Cliente</span>
                  <Link
                    to={`/clientes/${selectedAppt.cliente?.id}`}
                    className="block font-title font-semibold text-lg md:text-base text-rose-800 hover:text-rose-950 underline leading-snug mt-0.5"
                    title="Ver ficha clínica da cliente"
                  >
                    {selectedAppt.cliente?.nome} {selectedAppt.cliente?.sobrenome}
                  </Link>
                  <p className="text-xs md:text-[10px] text-text-secondary mt-0.5">WhatsApp: {selectedAppt.cliente?.whatsapp}</p>
                </div>

                {/* Status Badge */}
                <span className={`text-xs md:text-[10px] font-bold px-3 py-1 md:px-2.5 md:py-0.5 rounded-full uppercase tracking-wider
                  ${selectedAppt.status === 'confirmado' ? 'bg-green-100 text-green-800 border border-green-200' : ''}
                  ${selectedAppt.status === 'pendente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : ''}
                  ${selectedAppt.status === 'concluido' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}
                  ${selectedAppt.status === 'cancelado' ? 'bg-gray-100 text-gray-500 border border-gray-200' : ''}
                  ${selectedAppt.status === 'falta' ? 'bg-red-100 text-red-800 border border-red-200' : ''}
                `}>
                  {selectedAppt.status === 'falta' ? 'Falta' : selectedAppt.status}
                </span>
              </div>

              {/* Main parameters */}
              <div className="space-y-3.5 text-sm md:text-xs">

                {/* Date / Time */}
                <div className="grid grid-cols-[100px_1fr] border-b border-border/40 pb-2">
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Data / Horário:</span>
                  <span className="text-text-primary font-medium">
                    {new Date(selectedAppt.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })} às{' '}
                    {new Date(selectedAppt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-[100px_1fr] border-b border-border/40 pb-2">
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Duração:</span>
                  <span className="text-text-primary font-medium">{selectedAppt.duracao_minutos} minutos</span>
                </div>

                {/* List of services in details view */}
                <div>
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider block mb-1">Procedimentos:</span>
                  <div className="space-y-1 mt-1 bg-bg/25 border border-border/60 p-2.5 rounded-lg max-h-[120px] overflow-y-auto">
                    {selectedAppt.agendamento_servicos?.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm md:text-xs text-text-primary">
                        <span>
                          {s.servico?.nome}
                          {s.variacao?.nome && <span className="text-xs md:text-[10px] bg-gold-light/40 text-gold border border-gold-light/60 px-1 py-0.5 rounded font-normal ml-1">{s.variacao.nome}</span>}
                        </span>
                        <span className="font-semibold text-rose-800">R$ {Number(s.valor_cobrado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    <div className="border-t border-border/40 pt-1.5 mt-1.5 flex justify-between items-center text-base md:text-sm font-bold text-text-primary">
                      <span>Total</span>
                      <span className="text-rose-800">
                        R$ {selectedAppt.agendamento_servicos?.reduce((sum, s) => sum + Number(s.valor_cobrado), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {selectedAppt.observacoes && (
                  <div className="grid grid-cols-[100px_1fr] border-b border-border/40 pb-2">
                    <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Anotações:</span>
                    <span className="text-text-secondary italic">"{selectedAppt.observacoes}"</span>
                  </div>
                )}
              </div>

              {/* Status & Edit Controls */}
              <div className="pt-2 flex flex-col gap-2">

                {selectedAppt.status === 'pendente' && (
                  <>
                    <button
                      onClick={() => handleOpenApproveModal(selectedAppt)}
                      className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                    >
                      <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />
                      Confirmar Agendamento
                    </button>
                    <button
                      onClick={() => handleOpenRejectModal(selectedAppt)}
                      className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                    >
                      <XCircle className="w-5 h-5 md:w-4 md:h-4" />
                      Recusar / Cancelar
                    </button>
                  </>
                )}

                {selectedAppt.status === 'confirmado' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleChangeStatus(selectedAppt, 'concluido')}
                        className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 px-3 bg-green-600 hover:bg-green-800 text-white rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                      >
                        <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />
                        Concluir Atendimento
                      </button>
                      <button
                        onClick={() => handleChangeStatus(selectedAppt, 'cancelado')}
                        className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 px-3 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                      >
                        <XCircle className="w-5 h-5 md:w-4 md:h-4" />
                        Cancelar
                      </button>
                    </div>
                    {new Date(selectedAppt.data_hora) < new Date() && (
                      <button
                        onClick={() => handleMarkNoShow(selectedAppt)}
                        className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 w-full border border-red-300 hover:bg-red-50 text-red-700 rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                      >
                        <UserX className="w-5 h-5 md:w-4 md:h-4" />
                        Marcar Falta (No-show)
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEditForm(selectedAppt)}
                      className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 w-full bg-rose-600 hover:bg-rose-800 text-white rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                    >
                      <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                      Editar Agendamento
                    </button>
                  </>
                )}

                {(selectedAppt.status === 'concluido' || selectedAppt.status === 'cancelado' || selectedAppt.status === 'falta') && (
                  <p className="text-xs md:text-[11px] text-text-secondary italic text-center py-1 bg-bg rounded">
                    Agendamentos concluídos, cancelados ou com falta não podem ser editados.
                  </p>
                )}

                {/* Delete button (Admin only) */}
                {isProfissional && (
                  <button
                    onClick={() => handleDeleteAppointment(selectedAppt)}
                    className="flex items-center justify-center gap-1.5 py-2.5 md:py-2 w-full border border-border hover:bg-red-50 hover:text-red-600 text-text-secondary rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                    Excluir permanentemente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>, document.body)}

      {/* CONCLUDE MODAL */}
      {concludeAppt && (() => {
        const totalServicos = concludeAppt.agendamento_servicos?.reduce((sum, s) => sum + Number(s.valor_cobrado || 0), 0) || 0;
        const clientName = concludeAppt.cliente ? `${concludeAppt.cliente.nome} ${concludeAppt.cliente.sobrenome || ''}`.trim() : 'Cliente';
        return createPortal(
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[300] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-md flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-slide-up">
              {/* Header */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <h4 className="font-title font-bold text-xl md:text-lg text-white flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 md:w-5 md:h-5 text-emerald-100" />
                  Concluir Atendimento
                </h4>
                <button
                  onClick={() => setConcludeAppt(null)}
                  className="text-emerald-200 hover:text-white cursor-pointer"
                >
                  <X className="w-6 h-6 md:w-5 md:h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Client */}
                <div className="text-base md:text-sm text-text-primary">
                  <span className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-0.5">Cliente</span>
                  <span className="font-semibold">{clientName}</span>
                </div>

                {/* Services summary */}
                <div>
                  <span className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-text-secondary block mb-1.5">Procedimentos</span>
                  <div className="bg-bg/25 border border-border/60 p-3 rounded-lg space-y-1.5">
                    {concludeAppt.agendamento_servicos?.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm md:text-xs text-text-primary">
                        <span>
                          {s.servico?.nome}
                          {s.variacao?.nome && (
                            <span className="text-xs md:text-[10px] bg-gold-light/40 text-gold border border-gold-light/60 px-1 py-0.5 rounded font-normal ml-1">
                              {s.variacao.nome}
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-text-primary">
                          R$ {Number(s.valor_cobrado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border/40 pt-1.5 mt-1.5 flex justify-between items-center text-base md:text-sm font-bold text-text-primary">
                      <span>Total</span>
                      <span className="text-rose-800">
                        R$ {totalServicos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom value toggle */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-bg/40 rounded-lg border border-border/60 cursor-pointer select-none hover:bg-bg/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={concludeUseCustom}
                      onChange={(e) => {
                        setConcludeUseCustom(e.target.checked);
                        if (e.target.checked) setConcludeCustomValue(totalServicos);
                      }}
                      className="w-5 h-5 md:w-4 md:h-4 accent-rose-600 cursor-pointer"
                    />
                    <div>
                      <span className="text-sm md:text-xs font-semibold text-text-primary">Valor recebido diferente?</span>
                      <span className="text-xs md:text-[10px] text-text-muted block">Habilite se houve desconto ou valor negociado.</span>
                    </div>
                  </label>

                  {concludeUseCustom && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-sm md:text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                        Valor recebido (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={concludeCustomValue}
                        onChange={(e) => setConcludeCustomValue(parseFloat(e.target.value) || 0)}
                        className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                      {concludeCustomValue < totalServicos && concludeCustomValue >= 0 && (
                        <p className="text-xs md:text-[10px] text-amber-600 font-medium">
                          Desconto de R$ {(totalServicos - concludeCustomValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} aplicado.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Final value summary */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <span className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">Valor a registrar</span>
                  <span className="text-3xl md:text-2xl font-title font-bold text-emerald-900">
                    R$ {(concludeUseCustom ? concludeCustomValue : totalServicos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setConcludeAppt(null)}
                    disabled={concludeSaving}
                    className="px-4 py-2.5 md:py-2 border border-border rounded-lg text-sm md:text-xs font-medium text-text-secondary hover:bg-bg transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleConcludeConfirm}
                    disabled={concludeSaving}
                    className="px-5 py-3 md:py-2.5 bg-green-600 hover:bg-green-800 disabled:bg-green-300 text-white rounded-lg text-sm md:text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />
                    {concludeSaving ? 'Salvando...' : 'Concluir Atendimento'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* FORM MODAL (CREATE OR EDIT) */}
      <AgendamentoFormSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchAppointments}
        editingAppt={editingAppt}
        initialDate={formOpenDate}
        initialHour={formOpenHour}
        preSelectedCliente={preSelectedCliente}
      />

      {/* SUCCESS CONFIRMATION MODAL */}
      {successModal && successModal.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-md animate-slide-up overflow-hidden">

            {/* Header especial para conclusão */}
            {successModal.tipo === 'conclusao' ? (
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-6 pb-5 text-center text-white">
                <div className="mx-auto w-16 h-16 md:w-14 md:h-14 rounded-full bg-amber-400/25 flex items-center justify-center mb-3">
                  <Coins className="w-8 h-8 md:w-7 md:h-7 text-amber-300" />
                </div>
                <h3 className="font-title font-bold text-2xl md:text-xl leading-snug">
                  Atendimento Concluído!
                </h3>
                <p className="text-emerald-100 text-sm md:text-xs mt-1">
                  O valor já aparece nos seus relatórios.
                </p>
                {successModal.valor !== undefined && (
                  <div className="mt-4 bg-white/15 rounded-xl px-4 py-3 inline-block">
                    <p className="text-xs md:text-[10px] uppercase tracking-wider text-emerald-200 mb-0.5">Valor recebido</p>
                    <p className="font-title font-bold text-3xl md:text-2xl text-white">
                      R$ {successModal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 pt-6 pb-2 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 mb-3 animate-pulse">
                  <CheckCircle className="w-9 h-9" />
                </div>
                <h3 className="font-title font-bold text-2xl md:text-xl text-text-primary">{successModal.title}</h3>
                <p className="text-sm md:text-xs text-text-secondary mt-1">Os dados foram registrados com sucesso no sistema.</p>
              </div>
            )}

            {/* Details */}
            <div className="px-6 py-4 space-y-4">
              <div className="bg-bg/40 border border-border/80 rounded-xl p-4 text-sm md:text-xs space-y-2.5">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Cliente</span>
                  <span className="font-semibold text-text-primary">{successModal.clientName}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Procedimento(s)</span>
                  <span className="font-semibold text-text-primary max-w-[200px] truncate text-right">{successModal.services}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Data</span>
                  <span className="font-semibold text-text-primary">{successModal.dateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-text-secondary uppercase text-xs md:text-[10px] tracking-wider">Horário</span>
                  <span className="font-semibold text-text-primary">{successModal.timeStr}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSuccessModal(null)}
                className={`w-full py-3 md:py-2.5 rounded-lg text-sm md:text-xs font-semibold transition-colors cursor-pointer ${
                  successModal.tipo === 'conclusao'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-rose-600 hover:bg-rose-800 text-white'
                }`}
              >
                Concluir e Fechar
              </button>
            </div>

          </div>
        </div>, document.body)}

      {/* Bottom sheet: Trancar Horário */}
      <TrancarHorarioSheet
        isOpen={isTrancarOpen}
        onClose={() => setIsTrancarOpen(false)}
        onSuccess={fetchSetupData}
        initialDate={currentDate}
      />

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmModalConfig?.onConfirm || (() => {})}
        title={confirmModalConfig?.title || ''}
        description={confirmModalConfig?.description || ''}
        warningText={confirmModalConfig?.warningText}
        confirmText={confirmModalConfig?.confirmText}
        cancelText={confirmModalConfig?.cancelText}
        type={confirmModalConfig?.type}
      />

      {/* Approve Modal */}
      {approveModalAppt && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">

            {/* Header rose */}
            <div className="bg-gradient-to-br from-rose-600 to-rose-500 px-6 pt-3.5 pb-3.5 flex-shrink-0">
              <div className="flex items-start justify-between">
                <h3 className="font-title font-bold text-xl md:text-lg text-white">Confirmar agendamento</h3>
                <button onClick={() => setApproveModalAppt(null)} className="text-rose-200 hover:text-white cursor-pointer mt-0.5">
                  <X className="w-6 h-6 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-4 space-y-3">
                <div>
                  <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-rose-400">Cliente</p>
                  <p className="font-semibold text-base md:text-sm text-rose-900 mt-0.5">
                    {approveModalAppt.cliente?.nome} {approveModalAppt.cliente?.sobrenome} —{' '}
                    {new Date(approveModalAppt.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às{' '}
                    {new Date(approveModalAppt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="border-t border-rose-100 pt-3">
                  <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-rose-400">Serviço(s)</p>
                  <p className="font-semibold text-base md:text-sm text-rose-900 mt-0.5">{approveModalAppt.agendamento_servicos?.map(s => s.servico?.nome).filter(Boolean).join(', ') || '—'}</p>
                  {approveModalAppt.observacoes && (
                    <p className="text-rose-700 italic text-sm md:text-xs mt-1">"{approveModalAppt.observacoes}"</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleApproveConfirm(true)}
                  disabled={approveSaving}
                  className="flex items-center justify-center gap-2 w-full py-3 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />
                  {approveSaving ? 'Confirmando...' : 'Confirmar e enviar pelo WhatsApp'}
                </button>
                <button
                  onClick={() => handleApproveConfirm(false)}
                  disabled={approveSaving}
                  className="flex items-center justify-center gap-2 w-full py-3 md:py-2.5 bg-rose-600 hover:bg-rose-800 disabled:opacity-60 text-white rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-5 h-5 md:w-4 md:h-4" />
                  {approveSaving ? 'Confirmando...' : 'Confirmar sem enviar'}
                </button>
                <button
                  onClick={() => setApproveModalAppt(null)}
                  disabled={approveSaving}
                  className="w-full py-3 md:py-2.5 border border-border hover:bg-bg text-text-secondary rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>

          </div>
        </div>, document.body)}

      {/* Reject Modal */}
      {rejectModalAppt && createPortal(
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">

            {/* Header rose */}
            <div className="bg-gradient-to-br from-rose-600 to-rose-500 px-6 pt-3.5 pb-3.5 flex items-start justify-between flex-shrink-0">
              <h3 className="font-title font-bold text-xl md:text-lg text-white">Recusar agendamento</h3>
              <button onClick={() => setRejectModalAppt(null)} className="text-rose-200 hover:text-white cursor-pointer mt-0.5">
                <X className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-4 space-y-3">
                <div>
                  <p className="text-xs md:text-[10px] font-bold uppercase tracking-wider text-rose-400">Cliente</p>
                  <p className="font-semibold text-base md:text-sm text-rose-900 mt-0.5">
                    {rejectModalAppt.cliente?.nome} {rejectModalAppt.cliente?.sobrenome} —{' '}
                    {new Date(rejectModalAppt.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às{' '}
                    {new Date(rejectModalAppt.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm md:text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Motivo <span className="font-normal normal-case text-text-muted">(opcional)</span>
                </label>
                <textarea
                  value={rejectMotivo}
                  onChange={e => setRejectMotivo(e.target.value)}
                  placeholder="Ex: Desculpe, não vou conseguir atender nesse horário :("
                  rows={3}
                  className="w-full border border-border rounded-xl px-3.5 py-3 md:px-3 md:py-2.5 text-base md:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                />
                <p className="text-xs md:text-[11px] text-text-muted">
                  Se preenchido, o motivo será incluído na mensagem enviada pelo WhatsApp.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleRejectConfirm(true)}
                  disabled={rejectSaving}
                  className="flex items-center justify-center gap-2 w-full py-3 md:py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5 md:w-4 md:h-4" />
                  {rejectSaving ? 'Recusando...' : 'Recusar e notificar pelo WhatsApp'}
                </button>
                <button
                  onClick={() => handleRejectConfirm(false)}
                  disabled={rejectSaving}
                  className="flex items-center justify-center gap-2 w-full py-3 md:py-2.5 bg-rose-600 hover:bg-rose-800 disabled:opacity-60 text-white rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <XCircle className="w-5 h-5 md:w-4 md:h-4" />
                  {rejectSaving ? 'Recusando...' : 'Recusar sem notificar'}
                </button>
                <button
                  onClick={() => setRejectModalAppt(null)}
                  disabled={rejectSaving}
                  className="w-full py-3 md:py-2.5 border border-border hover:bg-bg text-text-secondary rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            </div>

          </div>
        </div>, document.body)}
    </div>
  );
}
