import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

interface TrancarHorarioSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: Date;
}

function formatDateInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function TrancarHorarioSheet({ isOpen, onClose, onSuccess, initialDate }: TrancarHorarioSheetProps) {
  const { estabelecimentoId } = useAuth();

  const [trancarData, setTrancarData] = useState('');
  const [trancarDiaInteiro, setTrancarDiaInteiro] = useState(true);
  const [trancarHoraInicio, setTrancarHoraInicio] = useState('12:00');
  const [trancarHoraFim, setTrancarHoraFim] = useState('13:00');
  const [trancarMotivo, setTrancarMotivo] = useState('');
  const [trancarSaving, setTrancarSaving] = useState(false);
  const [trancarError, setTrancarError] = useState<string | null>(null);
  const [trancarSuccess, setTrancarSuccess] = useState(false);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    description: string;
    warningText?: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // Reseta o formulário sempre que o sheet é reaberto (ajusta estado durante a
  // renderização em vez de um useEffect, seguindo o padrão do React pra evitar
  // o "flash" do formulário anterior antes do reset)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTrancarData(formatDateInput(initialDate || new Date()));
      setTrancarDiaInteiro(true);
      setTrancarHoraInicio('12:00');
      setTrancarHoraFim('13:00');
      setTrancarMotivo('');
      setTrancarError(null);
      setTrancarSuccess(false);
    }
  }

  const handleAplicarAtalhoAlmoco = () => {
    setTrancarDiaInteiro(false);
    setTrancarHoraInicio('12:00');
    setTrancarHoraFim('13:00');
  };

  const insertTrancamento = async () => {
    setTrancarSaving(true);
    try {
      const { error } = await supabase.from('bloqueios_agenda').insert({
        data_inicio: trancarData,
        data_fim: trancarData,
        dia_inteiro: trancarDiaInteiro,
        hora_inicio: trancarDiaInteiro ? null : `${trancarHoraInicio}:00`,
        hora_fim: trancarDiaInteiro ? null : `${trancarHoraFim}:00`,
        motivo: trancarMotivo.trim() || null,
        estabelecimento_id: estabelecimentoId,
      });
      if (error) throw error;

      setTrancarSaving(false);
      setTrancarSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error(err);
      setTrancarError('Falha ao trancar o horário.');
      setTrancarSaving(false);
    }
  };

  const handleSubmitTrancar = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrancarError(null);

    if (!trancarData) {
      setTrancarError('Selecione a data.');
      return;
    }
    if (!trancarDiaInteiro) {
      if (!trancarHoraInicio || !trancarHoraFim) {
        setTrancarError('Preencha os horários de início e fim.');
        return;
      }
      if (trancarHoraFim <= trancarHoraInicio) {
        setTrancarError('O horário de fim deve ser maior que o de início.');
        return;
      }
    }

    setTrancarSaving(true);
    try {
      // Verifica se já existem agendamentos ativos no período antes de trancar
      const dayStart = new Date(`${trancarData}T00:00:00`);
      const dayEnd = new Date(`${trancarData}T23:59:59.999`);

      const { data: dayAppts, error: apptErr } = await supabase
        .from('agendamentos')
        .select('id, data_hora, duracao_minutos')
        .eq('estabelecimento_id', estabelecimentoId)
        .neq('status', 'cancelado')
        .neq('status', 'falta')
        .gte('data_hora', dayStart.toISOString())
        .lte('data_hora', dayEnd.toISOString());
      if (apptErr) throw apptErr;

      const lockStart = trancarDiaInteiro ? dayStart : new Date(`${trancarData}T${trancarHoraInicio}:00`);
      const lockEnd = trancarDiaInteiro ? dayEnd : new Date(`${trancarData}T${trancarHoraFim}:00`);

      const conflicts = (dayAppts || []).filter(appt => {
        const apptStart = new Date(appt.data_hora);
        const apptEnd = new Date(apptStart.getTime() + appt.duracao_minutos * 60000);
        return lockStart < apptEnd && lockEnd > apptStart;
      });

      if (conflicts.length > 0) {
        setTrancarSaving(false);
        setConfirmModalConfig({
          title: 'Já existem agendamentos nesse período',
          description: `Há ${conflicts.length} agendamento${conflicts.length > 1 ? 's' : ''} ativo${conflicts.length > 1 ? 's' : ''} no período selecionado. Eles não serão cancelados automaticamente — você pode reagendá-los manualmente. Deseja trancar o horário mesmo assim?`,
          warningText: 'Os agendamentos existentes continuam normalmente na agenda.',
          confirmText: 'Trancar mesmo assim',
          onConfirm: insertTrancamento,
        });
        setConfirmModalOpen(true);
        return;
      }

      await insertTrancamento();
    } catch (err) {
      console.error(err);
      setTrancarError('Falha ao verificar agendamentos existentes.');
      setTrancarSaving(false);
    }
  };

  useBodyScrollLock(isOpen);
  const { dragHandlers, sheetStyle } = useSwipeToClose(() => !trancarSaving && onClose());

  if (!isOpen) return null;

  return createPortal(
    <>
      {trancarSuccess ? (
        // Confirmação de sucesso: modal centralizado, igual ao padrão usado nos
        // outros fluxos de sucesso do sistema (não o bottom sheet do formulário).
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[20px] border border-border shadow-xl w-full max-w-sm p-7 md:p-6 text-center animate-slide-up space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600 animate-pulse">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="font-title font-bold text-xl text-text-primary">Horário trancado com sucesso!</p>
          </div>
        </div>
      ) : (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center animate-fade-in"
          onClick={() => !trancarSaving && onClose()}
        >
          <div
            className="bg-white w-full sm:max-w-md rounded-t-[20px] sm:rounded-[16px] shadow-xl overflow-hidden animate-slide-up max-h-[92vh] overflow-y-auto"
            style={sheetStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}>
              {/* Drag handle (mobile) — arraste pra baixo pra fechar */}
              <div
                className="sm:hidden flex justify-center pt-3 pb-2 -mb-1"
                style={{ touchAction: 'none' }}
                {...dragHandlers}
              >
                <div className="w-10 h-1.5 bg-white/40 rounded-full" />
              </div>

              <div className="px-6 py-4 md:py-3.5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-title font-semibold text-2xl md:text-xl text-white flex items-center gap-2">
                    <Lock className="w-6 h-6 md:w-5 md:h-5 text-white" />
                    Trancar Horário
                  </h3>
                  <p className="text-xs md:text-[11px] font-semibold text-rose-100 uppercase tracking-wider mt-0.5">
                    Folga, feriado ou pausa
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-rose-100 hover:text-white transition-colors p-1 rounded-full hover:bg-white/15 cursor-pointer flex-shrink-0"
                >
                  <X className="w-6 h-6 md:w-5 md:h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmitTrancar} className="space-y-4">
                {/* Data */}
                <div className="space-y-1.5">
                  <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={trancarData}
                    onChange={(e) => setTrancarData(e.target.value)}
                    className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>

                {/* Dia inteiro / período específico */}
                <div className="space-y-1.5">
                  <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                    O que travar
                  </label>
                  <div className="flex bg-bg rounded-lg p-0.5 border border-border/40">
                    <button
                      type="button"
                      onClick={() => setTrancarDiaInteiro(true)}
                      className={`flex-1 px-3 py-2.5 md:py-2 rounded-md text-sm md:text-xs font-semibold transition-all cursor-pointer ${trancarDiaInteiro
                        ? 'bg-white text-rose-600 shadow-sm border border-border/30'
                        : 'text-text-secondary hover:text-rose-600'}`}
                    >
                      Dia inteiro
                    </button>
                    <button
                      type="button"
                      onClick={() => setTrancarDiaInteiro(false)}
                      className={`flex-1 px-3 py-2.5 md:py-2 rounded-md text-sm md:text-xs font-semibold transition-all cursor-pointer ${!trancarDiaInteiro
                        ? 'bg-white text-rose-600 shadow-sm border border-border/30'
                        : 'text-text-secondary hover:text-rose-600'}`}
                    >
                      Só um período
                    </button>
                  </div>
                </div>

                {!trancarDiaInteiro && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                          Início
                        </label>
                        <input
                          type="time"
                          required={!trancarDiaInteiro}
                          value={trancarHoraInicio}
                          onChange={(e) => setTrancarHoraInicio(e.target.value)}
                          className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                          Fim
                        </label>
                        <input
                          type="time"
                          required={!trancarDiaInteiro}
                          value={trancarHoraFim}
                          onChange={(e) => setTrancarHoraFim(e.target.value)}
                          className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAplicarAtalhoAlmoco}
                      className="text-xs md:text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer underline underline-offset-2"
                    >
                      Atalho: horário de almoço (12:00–13:00)
                    </button>
                  </div>
                )}

                {/* Motivo */}
                <div className="space-y-1.5">
                  <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary block">
                    Motivo <span className="text-text-muted font-normal normal-case">(opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex.: feriado, folga, compromisso pessoal..."
                    value={trancarMotivo}
                    onChange={(e) => setTrancarMotivo(e.target.value)}
                    className="w-full px-3.5 py-3 md:px-3 md:py-2 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                  />
                </div>

                {trancarError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0 text-red-600" />
                    <p className="text-sm md:text-xs font-medium">{trancarError}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-100 rounded-lg p-3">
                  <AlertCircle className="w-5 h-5 md:w-4 md:h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs md:text-[11px] text-amber-800 leading-relaxed">
                    Se já houver agendamentos ativos nesse período, você verá um aviso antes de trancar — eles não são cancelados automaticamente.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={trancarSaving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 md:py-3 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-base md:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Lock className="w-5 h-5 md:w-4 md:h-4" />
                  {trancarSaving ? 'Trancando...' : 'Trancar Horário'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmModalConfig?.onConfirm || (() => {})}
        title={confirmModalConfig?.title || ''}
        description={confirmModalConfig?.description || ''}
        warningText={confirmModalConfig?.warningText}
        confirmText={confirmModalConfig?.confirmText}
        type="warning"
      />
    </>,
    document.body
  );
}
