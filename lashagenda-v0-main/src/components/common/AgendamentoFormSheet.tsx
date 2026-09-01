import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, X, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { registrarLog } from '../../utils/log';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getInitials } from '../../utils/initials';
import type {
  Cliente,
  Servico,
  BloqueioAgenda,
  AgendamentoServicoInput,
  AgendamentoWithRelations,
} from '../../types';

interface AgendamentoFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingAppt?: AgendamentoWithRelations | null;
  initialDate?: Date;
  initialHour?: string;
  preSelectedCliente?: Cliente | null;
}

export default function AgendamentoFormSheet({
  isOpen,
  onClose,
  onSaved,
  editingAppt,
  initialDate,
  initialHour,
  preSelectedCliente,
}: AgendamentoFormSheetProps) {
  const { estabelecimentoId } = useAuth();

  // Dados de apoio (buscados uma vez, independente do sheet estar aberto)
  const [workHoursConfig, setWorkHoursConfig] = useState<{ dia_semana: number; hora_inicio: string; hora_fim: string }[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);

  useEffect(() => {
    if (!estabelecimentoId) return;
    const fetchSetupData = async () => {
      try {
        const [horariosRes, srvsRes, bloqRes] = await Promise.all([
          supabase.from('horarios_atendimento').select('dia_semana, hora_inicio, hora_fim').eq('estabelecimento_id', estabelecimentoId),
          supabase.from('servicos').select('*').eq('estabelecimento_id', estabelecimentoId).order('nome'),
          supabase.from('bloqueios_agenda').select('*').eq('estabelecimento_id', estabelecimentoId),
        ]);
        if (horariosRes.error) throw horariosRes.error;
        if (srvsRes.error) throw srvsRes.error;
        if (bloqRes.error) throw bloqRes.error;
        setWorkHoursConfig(horariosRes.data || []);
        setServicos(srvsRes.data || []);
        setBloqueios(bloqRes.data || []);
      } catch (err) {
        console.error('Erro de setup:', err);
      }
    };
    fetchSetupData();
  }, [estabelecimentoId]);

  // Autocomplete de cliente
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [foundClientes, setFoundClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const searchClients = async () => {
      if (clientSearchQuery.trim().length < 2) {
        setFoundClientes([]);
        return;
      }
      if (!estabelecimentoId) return;
      try {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .eq('estabelecimento_id', estabelecimentoId)
          .or(`nome.ilike.%${clientSearchQuery}%,sobrenome.ilike.%${clientSearchQuery}%,whatsapp.like.%${clientSearchQuery}%`)
          .limit(5);
        if (error) throw error;
        setFoundClientes(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    const delayDebounce = setTimeout(searchClients, 300);
    return () => clearTimeout(delayDebounce);
  }, [clientSearchQuery, estabelecimentoId]);

  // Campos do formulário
  const [formData, setFormData] = useState('');
  const [formHora, setFormHora] = useState('09:00');
  const [formDuracao, setFormDuracao] = useState(30);
  const [formObs, setFormObs] = useState('');
  const [selectedServices, setSelectedServices] = useState<Record<string, AgendamentoServicoInput>>({});

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [savedSummary, setSavedSummary] = useState<{ isEdit: boolean; clientName: string; dateStr: string; timeStr: string } | null>(null);

  // Reseta/preenche o formulário sempre que o sheet é reaberto (ajusta estado
  // durante a renderização em vez de um useEffect, seguindo o padrão do React)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setFormError(null);
      setFormSuccess(false);
      setSaving(false);
      setShowClientDropdown(false);

      if (editingAppt) {
        if (editingAppt.cliente) {
          setSelectedCliente({
            id: editingAppt.cliente.id,
            nome: editingAppt.cliente.nome,
            sobrenome: editingAppt.cliente.sobrenome,
            whatsapp: editingAppt.cliente.whatsapp,
            ativo: true,
            gestante: false,
          } as Cliente);
        } else {
          setSelectedCliente(null);
        }
        setClientSearchQuery('');
        setFormObs(editingAppt.observacoes || '');
        setFormDuracao(editingAppt.duracao_minutos);

        const dateObj = new Date(editingAppt.data_hora);
        setFormData(dateObj.toISOString().split('T')[0]);
        const h = dateObj.getHours().toString().padStart(2, '0');
        const m = dateObj.getMinutes().toString().padStart(2, '0');
        setFormHora(`${h}:${m}`);

        const servicesMap: Record<string, AgendamentoServicoInput> = {};
        if (editingAppt.agendamento_servicos) {
          editingAppt.agendamento_servicos.forEach(as => {
            const fullSrv = servicos.find(s => s.id === as.servico_id);
            servicesMap[as.servico_id] = {
              servico_id: as.servico_id,
              nome: as.servico?.nome || fullSrv?.nome || '',
              duracao: fullSrv?.duracao_minutos || 30,
              valor: Number(as.valor_cobrado),
            };
          });
        }
        setSelectedServices(servicesMap);
      } else {
        setSelectedCliente(preSelectedCliente || null);
        setClientSearchQuery(preSelectedCliente ? `${preSelectedCliente.nome} ${preSelectedCliente.sobrenome || ''}`.trim() : '');
        setFormObs('');
        setSelectedServices({});
        setFormDuracao(0);

        const targetDate = initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        setFormData(targetDate);

        if (initialHour) {
          setFormHora(initialHour);
        } else {
          const selectedDay = initialDate || new Date();
          const dayOfWeek = selectedDay.getDay();
          const sched = workHoursConfig.find(h => h.dia_semana === dayOfWeek);
          setFormHora(sched ? sched.hora_inicio.substring(0, 5) : '09:00');
        }
      }
    }
  }

  const handleDateChange = (newDateStr: string) => {
    setFormData(newDateStr);
    const dateObj = new Date(`${newDateStr}T12:00:00`);
    const dayOfWeek = dateObj.getDay();
    const sched = workHoursConfig.find(h => h.dia_semana === dayOfWeek);
    setFormHora(sched ? sched.hora_inicio.substring(0, 5) : '09:00');
  };

  const recalculateDurationAndValues = (servicesMap: Record<string, AgendamentoServicoInput>) => {
    const totalD = Object.values(servicesMap).reduce((sum, s) => sum + s.duracao, 0);
    setFormDuracao(totalD);
  };

  const handleToggleServiceCheckbox = (serv: Servico, checked: boolean) => {
    const updated = { ...selectedServices };

    if (checked) {
      updated[serv.id] = {
        servico_id: serv.id,
        nome: serv.nome,
        duracao: serv.duracao_minutos,
        valor: Number(serv.valor),
      };
    } else {
      delete updated[serv.id];
    }

    setSelectedServices(updated);
    recalculateDurationAndValues(updated);
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedCliente) {
      setFormError('Você deve selecionar um cliente cadastrado.');
      return;
    }

    const servicesList = Object.values(selectedServices);
    if (servicesList.length === 0) {
      setFormError('Selecione pelo menos 1 serviço.');
      return;
    }

    if (formDuracao <= 0) {
      setFormError('A duração total deve ser maior que 0 minutos.');
      return;
    }

    setSaving(true);
    try {
      // 1. Calculate time coordinates
      const startDateTime = new Date(`${formData}T${formHora}:00`);
      const endDateTime = new Date(startDateTime.getTime() + formDuracao * 60000);

      const dayOfWeek = startDateTime.getDay();
      const startHourStr = startDateTime.toLocaleTimeString('pt-BR', { hour12: false });
      const endHourStr = endDateTime.toLocaleTimeString('pt-BR', { hour12: false });

      // Check if the date falls in a blocked period (full day or overlapping time slot)
      const matchedBlock = bloqueios.find(b => {
        if (formData >= b.data_inicio && formData <= b.data_fim) {
          if (b.dia_inteiro !== false) {
            return true; // full day block
          }
          if (b.hora_inicio && b.hora_fim) {
            return startHourStr < b.hora_fim && endHourStr > b.hora_inicio; // hourly overlap
          }
        }
        return false;
      });

      if (matchedBlock) {
        const escopo = matchedBlock.dia_inteiro !== false
          ? 'Esse dia está trancado na sua agenda'
          : 'Esse horário está trancado na sua agenda';
        const motivo = matchedBlock.motivo ? ` (${matchedBlock.motivo})` : '';
        setFormError(`${escopo}${motivo}. Para agendar mesmo assim, remova o bloqueio em "Meus Horários".`);
        setSaving(false);
        return;
      }

      // 2. Expediente check: consult global horarios_atendimento (skip if not configured)
      if (workHoursConfig.length > 0) {
        const daySched = workHoursConfig.find(h => h.dia_semana === dayOfWeek);
        if (!daySched) {
          setFormError('Não há atendimento configurado para o dia selecionado.');
          setSaving(false);
          return;
        }
        if (startHourStr < daySched.hora_inicio || endHourStr > daySched.hora_fim) {
          setFormError(`Horário fora do expediente (${daySched.hora_inicio.substring(0, 5)} - ${daySched.hora_fim.substring(0, 5)}).`);
          setSaving(false);
          return;
        }
      }

      // 3. Overlap check against global agenda (excluding itself if editing)
      const dayStart = new Date(startDateTime);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startDateTime);
      dayEnd.setHours(23, 59, 59, 999);

      let agendaQuery = supabase
        .from('agendamentos')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .neq('status', 'cancelado')
        .neq('status', 'falta')
        .gte('data_hora', dayStart.toISOString())
        .lte('data_hora', dayEnd.toISOString());

      if (editingAppt) {
        agendaQuery = agendaQuery.neq('id', editingAppt.id);
      }

      const { data: agendaAppts, error: agendaErr } = await agendaQuery;
      if (agendaErr) throw agendaErr;

      const agendaConflict = (agendaAppts || []).some(appt => {
        const apptStart = new Date(appt.data_hora);
        const apptEnd = new Date(apptStart.getTime() + appt.duracao_minutos * 60000);
        return startDateTime < apptEnd && endDateTime > apptStart;
      });

      if (agendaConflict) {
        setFormError('Já existe outro agendamento neste mesmo horário.');
        setSaving(false);
        return;
      }

      let apptId = '';
      const clientName = `${selectedCliente.nome} ${selectedCliente.sobrenome || ''}`.trim();
      let createdNew = false;
      let existingRelationsIds: string[] = [];

      if (editingAppt) {
        const { data: existingRels } = await supabase
          .from('agendamento_servicos')
          .select('id')
          .eq('agendamento_id', editingAppt.id);
        existingRelationsIds = existingRels?.map(r => r.id) || [];

        const { error } = await supabase
          .from('agendamentos')
          .update({
            cliente_id: selectedCliente.id,
            data_hora: startDateTime.toISOString(),
            duracao_minutos: formDuracao,
            observacoes: formObs.trim() || null,
          })
          .eq('id', editingAppt.id)
          .eq('estabelecimento_id', estabelecimentoId);

        if (error) throw error;
        apptId = editingAppt.id;
      } else {
        const { data: apptResult, error: apptError } = await supabase
          .from('agendamentos')
          .insert({
            estabelecimento_id: estabelecimentoId,
            cliente_id: selectedCliente.id,
            data_hora: startDateTime.toISOString(),
            duracao_minutos: formDuracao,
            status: 'confirmado',
            origem: 'admin',
            observacoes: formObs.trim() || null,
          })
          .select()
          .single();

        if (apptError) throw apptError;
        if (!apptResult) throw new Error('Falha ao criar agendamento.');
        apptId = apptResult.id;
        createdNew = true;
      }

      // Inserir Agendamento Serviços
      const relPayloads = servicesList.map(s => ({
        agendamento_id: apptId,
        servico_id: s.servico_id,
        valor_cobrado: s.valor,
      }));

      const { error: relError } = await supabase
        .from('agendamento_servicos')
        .insert(relPayloads);

      if (relError) {
        if (createdNew && apptId) {
          await supabase.from('agendamentos').delete().eq('id', apptId);
        }
        throw relError;
      }

      if (editingAppt && existingRelationsIds.length > 0) {
        await supabase
          .from('agendamento_servicos')
          .delete()
          .in('id', existingRelationsIds);
      }

      if (editingAppt) {
        await registrarLog('editou', 'agendamento', apptId, `Editou agendamento de "${clientName}"`);
      } else {
        await registrarLog('criou', 'agendamento', apptId, `Criou agendamento para "${clientName}"`);
      }

      setSaving(false);
      setSavedSummary({
        isEdit: !!editingAppt,
        clientName,
        dateStr: startDateTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
        timeStr: startDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
      setFormSuccess(true);
      onSaved?.();
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      console.error(err);
      setFormError('Falha ao salvar agendamento.');
      setSaving(false);
    }
  };

  useBodyScrollLock(isOpen);
  const { dragHandlers, sheetStyle } = useSwipeToClose(() => !saving && onClose());

  if (!isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/45 backdrop-blur-sm z-[200] flex justify-center animate-fade-in ${
        formSuccess ? 'items-center p-4' : 'items-end sm:items-center'
      }`}
      onClick={() => !saving && onClose()}
    >
      {formSuccess ? (
        <div className="bg-white rounded-[20px] border border-border shadow-xl w-full max-w-sm p-7 md:p-6 text-center animate-slide-up space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 animate-pulse">
            <CheckCircle className="w-8 h-8" />
          </div>
          <p className="font-title font-bold text-xl text-text-primary">
            {savedSummary?.isEdit ? 'Agendamento atualizado!' : 'Agendamento criado com sucesso!'}
          </p>
          {savedSummary && (
            <p className="text-sm text-text-secondary">
              {savedSummary.clientName} • {savedSummary.dateStr} às {savedSummary.timeStr}
            </p>
          )}
        </div>
      ) : (
        <div
          className="bg-white w-full sm:max-w-lg rounded-t-[20px] sm:rounded-[16px] border-0 sm:border sm:border-border shadow-xl flex flex-col max-h-[92vh] sm:max-h-[calc(100vh-2rem)] overflow-hidden animate-slide-up"
          style={sheetStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex-shrink-0"
            style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
          >
            {/* Drag handle (mobile) — arraste pra baixo pra fechar */}
            <div
              className="sm:hidden flex justify-center pt-3 pb-2 -mb-1"
              style={{ touchAction: 'none' }}
              {...dragHandlers}
            >
              <div className="w-10 h-1.5 bg-white/40 rounded-full" />
            </div>

            <div className="px-6 py-4 md:py-3.5 flex items-center justify-between gap-2">
              <h4 className="font-title font-semibold text-2xl md:text-xl text-white flex items-center gap-2">
                <CalendarDays className="w-6 h-6 md:w-5 md:h-5 text-white" />
                {editingAppt ? 'Editar Agendamento' : 'Agendar Novo Procedimento'}
              </h4>
              <button
                onClick={onClose}
                className="text-rose-100 hover:text-white transition-colors p-1 rounded-full hover:bg-white/15 cursor-pointer flex-shrink-0"
              >
                <X className="w-6 h-6 md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveAppointment} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0">

            {/* Cliente Autocomplete Search */}
            <div className="space-y-1.5 relative">
              <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary flex justify-between">
                <span>Buscar Cliente *</span>
                {selectedCliente && <span className="text-green-600">✓ Selecionada</span>}
              </label>

              {selectedCliente ? (
                <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-sm md:text-xs">
                      {getInitials(selectedCliente.nome, selectedCliente.sobrenome)}
                    </div>
                    <div>
                      <p className="text-sm md:text-xs font-bold text-text-primary">{selectedCliente.nome} {selectedCliente.sobrenome}</p>
                      <p className="text-xs md:text-[10px] text-text-secondary">Whats: {selectedCliente.whatsapp}</p>
                    </div>
                  </div>
                  {!editingAppt && (
                    <button
                      type="button"
                      onClick={() => setSelectedCliente(null)}
                      className="p-1 hover:bg-rose-100 rounded text-rose-600 cursor-pointer"
                    >
                      <X className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-text-muted" />
                    <input
                      ref={clientInputRef}
                      type="text"
                      required
                      placeholder="Nome ou WhatsApp do cliente..."
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className="w-full pl-10 pr-4 py-3 md:py-2 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                    />
                  </div>

                  {showClientDropdown && clientSearchQuery.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-border shadow-lg rounded-lg z-50 overflow-hidden mt-1 text-sm md:text-xs">
                      {foundClientes.length === 0 ? (
                        <div className="p-3 text-center text-text-muted italic">Nenhuma cliente ativa encontrada.</div>
                      ) : (
                        foundClientes.map(client => (
                          <div
                            key={client.id}
                            onClick={() => {
                              setSelectedCliente(client);
                              setShowClientDropdown(false);
                            }}
                            className="px-4 py-3 md:py-2.5 hover:bg-rose-50/50 cursor-pointer border-b border-border/40 last:border-0 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-bold text-text-primary">{client.nome} {client.sobrenome}</p>
                              <p className="text-xs md:text-[10px] text-text-secondary">WhatsApp: {client.whatsapp}</p>
                            </div>
                            <span className="text-xs md:text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Selecionar</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Data & Horário Início */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={formData}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3.5 py-3 md:px-3 md:py-2 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Hora de Início *
                </label>
                <input
                  type="time"
                  required
                  value={formHora}
                  onChange={(e) => setFormHora(e.target.value)}
                  className="w-full px-3.5 py-3 md:px-3 md:py-2 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>

            {/* Serviços Selection */}
            <div className="space-y-2">
              <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center justify-between border-b border-border pb-1.5">
                <span>Selecione os Serviços *</span>
                {Object.keys(selectedServices).length > 0 && (
                  <span className="text-rose-600 normal-case font-bold">
                    {Object.keys(selectedServices).length} selecionado{Object.keys(selectedServices).length > 1 ? 's' : ''}
                  </span>
                )}
              </label>
              <div className="space-y-2">
                {servicos.map(srv => {
                  const isChecked = !!selectedServices[srv.id];
                  return (
                    <label
                      key={srv.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-rose-50/25 border-rose-300' : 'bg-white border-border/60 hover:border-rose-200'}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleServiceCheckbox(srv, e.target.checked)}
                        className="w-5 h-5 md:w-4 md:h-4 accent-rose-600 cursor-pointer shrink-0"
                      />
                      <div className="text-sm md:text-xs min-w-0 flex-1">
                        <p className="font-bold text-text-primary truncate">{srv.nome}</p>
                        <p className="text-xs md:text-[10px] text-text-secondary mt-0.5">{srv.duracao_minutos} min</p>
                      </div>
                      <span className="font-title font-bold text-lg md:text-base text-rose-700 shrink-0">
                        R$ {Number(srv.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Recalculated outputs */}
            <div className="grid grid-cols-2 gap-4 bg-rose-50/25 border border-rose-100 p-3.5 rounded-lg">
              <div>
                <span className="flex items-center gap-1 text-xs md:text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  Duração
                </span>
                <span className="font-title font-bold text-xl md:text-lg text-rose-800">
                  {formDuracao} min
                </span>
              </div>

              <div className="text-right">
                <span className="block text-xs md:text-[10px] font-semibold uppercase tracking-wide text-text-secondary">Total</span>
                <span className="font-title font-bold text-xl md:text-lg text-rose-800">
                  R$ {Object.values(selectedServices).reduce((sum, s) => sum + s.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-1.5">
              <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Observações
              </label>
              <textarea
                rows={2}
                placeholder="Instruções especiais ou anotações..."
                value={formObs}
                onChange={(e) => setFormObs(e.target.value)}
                className="w-full px-3.5 py-3 md:px-3 md:py-2 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
              />
            </div>

          </div>

          {/* Form Actions — fora da área rolável, sempre visível */}
          <div className="p-6 pt-4 border-t border-border flex-shrink-0 bg-white space-y-3">
            {formError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
                <AlertCircle className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0 text-red-600" />
                <p className="text-sm md:text-xs font-medium">{formError}</p>
              </div>
            )}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 md:py-2.5 border border-border rounded-xl text-base md:text-sm font-semibold text-text-secondary hover:bg-bg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-5 py-3 md:py-2.5 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
              >
                {saving ? 'Salvando...' : (editingAppt ? 'Salvar Alterações' : 'Criar Agendamento')}
              </button>
            </div>
          </div>
          </form>
        </div>
      )}
    </div>,
    document.body
  );
}
