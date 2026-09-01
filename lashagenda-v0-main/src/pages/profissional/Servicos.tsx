import { useState, useEffect, useRef } from 'react';
import { useOnboarding } from '../../hooks/useOnboarding';
import { useGuidedTour } from '../../hooks/useGuidedTour';
import { useGuidedTourFieldTips } from '../../hooks/useGuidedTourFieldTips';
import type { DriveStep } from 'driver.js';
import posthog from 'posthog-js';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  Sparkles,
  Clock,
  Coins,
  X,
  ImagePlus,
  Tag,
  ChevronDown,
  WandSparkles,
} from 'lucide-react';
import type { Servico } from '../../types';
import { registrarLog } from '../../utils/log';
import ConfirmModal from '../../components/common/ConfirmModal';
import { compressImage } from '../../utils/imageCompression';

interface ServicoWithRelations extends Servico {
  _count_atendimentos?: number;
  _count_agendamentos?: number;
}

// Tooltips de campo do checklist guiado — formulário de novo serviço + a
// lista de serviços já cadastrados, conteúdo próprio e independente do tour
// do botão Ajuda.
const SERVICOS_FIELD_TIPS: DriveStep[] = [
  {
    element: '#gt-servico-nome',
    popover: {
      title: 'Nome do serviço',
      description: 'O nome que suas clientes veem ao escolher um serviço no portal.',
    },
  },
  {
    element: '#gt-servico-preco',
    popover: {
      title: 'Preço',
      description: 'Valor cobrado pelo serviço. Dá pra ajustar quando quiser.',
    },
  },
  {
    element: '#gt-servico-duracao',
    popover: {
      title: 'Duração',
      description: 'Tempo do atendimento em minutos — usado pra montar sua agenda de horários disponíveis.',
    },
  },
  {
    element: '#ob-servicos-lista',
    popover: {
      title: 'Você já tem 2 serviços prontos',
      description: 'Fio a Fio Clássico e Volume Russo já estão cadastrados como base. Edite os preços e detalhes à vontade, ou apague e cadastre os seus.',
    },
  },
];

export default function Servicos() {
  const { estabelecimentoId, profile, isPaginaVista, markPageSeen } = useAuth();
  const { autoStart } = useOnboarding('servicos');
  const { eligible: guidedTourEligible } = useGuidedTour();
  // Contas cobertas pelo checklist guiado não recebem mais o tour automático
  // do driver.js nessa tela — ele continua disponível sob demanda pelo Ajuda.
  useEffect(() => { if (profile && !guidedTourEligible) autoStart(); }, [profile, guidedTourEligible]); // eslint-disable-line react-hooks/exhaustive-deps

  const formRef = useRef<HTMLDivElement>(null);

  const [servicos, setServicos] = useState<ServicoWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // O último passo aponta pra lista de serviços já cadastrados — só faz
  // sentido incluir se ela realmente tiver algum serviço nesse momento.
  useGuidedTourFieldTips(
    'servicos',
    servicos.length > 0 ? SERVICOS_FIELD_TIPS : SERVICOS_FIELD_TIPS.filter(s => s.element !== '#ob-servicos-lista')
  );

  // Selected item for editing (null = modo criação)
  const [editingServico, setEditingServico] = useState<ServicoWithRelations | null>(null);

  // Form states - Servico
  const [servicoNome, setServicoNome] = useState('');
  const [servicoDescricao, setServicoDescricao] = useState('');
  const [servicoDuracao, setServicoDuracao] = useState<number | ''>(30);
  const [servicoValor, setServicoValor] = useState<number | ''>(100.0);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Imagem do serviço
  const [servicoImagemFile, setServicoImagemFile] = useState<File | null>(null);
  const [servicoImagemPreviewUrl, setServicoImagemPreviewUrl] = useState<string | null>(null);
  const [removerImagem, setRemoverImagem] = useState(false);
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const imagemFileInputRef = useRef<HTMLInputElement>(null);

  // Tooltip / Notification state for delete locks
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inline error no form
  const [servicoError, setServicoError] = useState<string | null>(null);

  // Confirm Modal States
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    description: string;
    warningText?: string;
    onConfirm: () => void;
  } | null>(null);

  const openConfirmModal = (config: typeof confirmModalConfig) => {
    setConfirmModalConfig(config);
    setConfirmModalOpen(true);
  };

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: ''
  });

  // Aviso "esses são serviços de exemplo" (some no primeiro acesso)
  const [exampleBannerDismissed, setExampleBannerDismissed] = useState(false);

  // Fetch all services
  const fetchData = async () => {
    if (!estabelecimentoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('nome', { ascending: true });

      if (error) throw error;
      setServicos(data || []);
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
      showTemporaryError('Falha ao carregar dados do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (estabelecimentoId) {
      fetchData();
    }
  }, [estabelecimentoId]);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // FORM ACTIONS
  const resetForm = () => {
    setEditingServico(null);
    setServicoError(null);
    setServicoNome('');
    setServicoDescricao('');
    setServicoDuracao(30);
    setServicoValor(100.0);
    setServicoImagemFile(null);
    setServicoImagemPreviewUrl(null);
    setRemoverImagem(false);
    setShowOptionalFields(false);
    if (imagemFileInputRef.current) imagemFileInputRef.current.value = '';
  };

  const handleEditServico = (serv: ServicoWithRelations) => {
    setServicoError(null);
    setServicoImagemFile(null);
    setRemoverImagem(false);
    setEditingServico(serv);
    setServicoNome(serv.nome);
    setServicoDescricao(serv.descricao ?? '');
    setServicoDuracao(serv.duracao_minutos);
    setServicoValor(Number(serv.valor));
    setServicoImagemPreviewUrl(serv.imagem_url ?? null);
    setShowOptionalFields(!!(serv.descricao || serv.imagem_url));
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleImagemSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setServicoImagemFile(compressed);
      setServicoImagemPreviewUrl(URL.createObjectURL(compressed));
      setRemoverImagem(false);
    } catch {
      showTemporaryError('Não foi possível processar a imagem.');
    }
  };

  const handleRemoverImagem = () => {
    setServicoImagemFile(null);
    setServicoImagemPreviewUrl(null);
    setRemoverImagem(true);
    if (imagemFileInputRef.current) imagemFileInputRef.current.value = '';
  };

  const handleSaveServico = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoNome.trim()) return;

    const normalizar = (s: string) =>
      s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const nomeNorm = normalizar(servicoNome);
    const duplicata = servicos.find(
      s => normalizar(s.nome) === nomeNorm && s.id !== editingServico?.id
    );
    if (duplicata) {
      setServicoError(`Já existe um serviço com o nome "${duplicata.nome}".`);
      return;
    }
    setServicoError(null);

    try {
      let servicoId = '';
      const duracaoFinal = servicoDuracao === '' ? 0 : servicoDuracao;
      const valorFinal = servicoValor === '' ? 0 : servicoValor;

      // Upload imagem se houver arquivo novo
      let imagemUrlFinal: string | null | undefined = undefined;
      if (servicoImagemFile && estabelecimentoId) {
        setUploadingImagem(true);
        const timestamp = Date.now();
        const filePath = `${estabelecimentoId}/servico-${timestamp}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('servicos-imagens')
          .upload(filePath, servicoImagemFile, { cacheControl: '3600', upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('servicos-imagens').getPublicUrl(filePath);
        imagemUrlFinal = urlData.publicUrl;
      } else if (removerImagem) {
        imagemUrlFinal = null;
      }

      if (editingServico) {
        const updatePayload: Record<string, unknown> = {
          nome: servicoNome,
          descricao: servicoDescricao.trim() || null,
          duracao_minutos: duracaoFinal,
          valor: valorFinal,
        };
        if (imagemUrlFinal !== undefined) updatePayload.imagem_url = imagemUrlFinal;

        const { error } = await supabase
          .from('servicos')
          .update(updatePayload)
          .eq('id', editingServico.id);

        if (error) throw error;
        servicoId = editingServico.id;
        await registrarLog('editou', 'servico', servicoId, `Editou serviço "${servicoNome}"`);
      } else {
        const { data, error } = await supabase
          .from('servicos')
          .insert({
            nome: servicoNome,
            descricao: servicoDescricao.trim() || null,
            duracao_minutos: duracaoFinal,
            valor: valorFinal,
            estabelecimento_id: estabelecimentoId,
            ...(imagemUrlFinal !== undefined ? { imagem_url: imagemUrlFinal } : {}),
          })
          .select()
          .single();

        if (error) throw error;
        if (!data) throw new Error('Falha ao criar serviço');
        servicoId = data.id;
        await registrarLog('criou', 'servico', servicoId, `Criou serviço "${servicoNome}"`);
        posthog.capture('servico_criado', {
          valor: valorFinal,
          duracao_minutos: duracaoFinal,
        });
      }

      const wasEditing = !!editingServico;
      resetForm();
      fetchData();
      setSuccessModal({
        isOpen: true,
        title: wasEditing ? 'Serviço atualizado!' : 'Serviço criado!',
        description: wasEditing
          ? `O serviço "${servicoNome}" foi atualizado com sucesso.`
          : `O serviço "${servicoNome}" foi criado com sucesso.`
      });
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : '';
      if (msg.toLowerCase().includes('storage') || msg.toLowerCase().includes('upload')) {
        showTemporaryError('Falha ao enviar imagem. Tente novamente.');
      } else {
        showTemporaryError('Falha ao salvar serviço.');
      }
    } finally {
      setUploadingImagem(false);
    }
  };

  const handleDeleteServico = async (serv: ServicoWithRelations) => {
    // Regra: não pode excluir serviço com atendimentos registrados
    try {
      const { count: atendimentosCount, error: atendimentosError } = await supabase
        .from('atendimentos')
        .select('*', { count: 'exact', head: true })
        .eq('servico_id', serv.id);

      if (atendimentosError) throw atendimentosError;

      const { count: agendamentoServicosCount, error: agendamentoServicosError } = await supabase
        .from('agendamento_servicos')
        .select('*', { count: 'exact', head: true })
        .eq('servico_id', serv.id);

      if (agendamentoServicosError) throw agendamentoServicosError;

      const totalVinculos = (atendimentosCount || 0) + (agendamentoServicosCount || 0);

      if (totalVinculos > 0) {
        showTemporaryError(`Não é permitido excluir o serviço "${serv.nome}" pois existem ${totalVinculos} atendimentos/agendamentos vinculados.`);
        return;
      }

      openConfirmModal({
        title: 'Excluir Serviço?',
        description: `Tem certeza que deseja excluir o serviço "${serv.nome}"?`,
        warningText: 'Esta ação é permanente e não pode ser desfeita.',
        onConfirm: async () => {
          try {
            const { error: delError } = await supabase
              .from('servicos')
              .delete()
              .eq('id', serv.id);

            if (delError) throw delError;

            await registrarLog('excluiu', 'servico', serv.id, `Excluiu serviço "${serv.nome}"`);
            if (editingServico?.id === serv.id) resetForm();
            fetchData();
          } catch (err) {
            console.error(err);
            showTemporaryError('Falha ao excluir o serviço.');
          }
        }
      });
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao verificar atendimentos vinculados ou excluir.');
    }
  };

  // FILTER LOGIC
  const filteredServicos = servicos.filter(serv =>
    serv.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Só mostra o aviso de exemplo enquanto a base ainda parecer ser 100% a base
  // de exemplo (nenhum serviço editado, adicionado ou com imagem própria) e
  // ela ainda não tiver dispensado o aviso antes.
  const isDefaultServiceBase =
    servicos.length > 0 &&
    servicos.every(s => !!s.imagem_url && s.imagem_url.includes('/defaults/'));

  const showExampleBanner =
    isDefaultServiceBase && !exampleBannerDismissed && !isPaginaVista('servicos_exemplo_banner');

  const dismissExampleBanner = () => {
    setExampleBannerDismissed(true);
    markPageSeen('servicos_exemplo_banner');
  };

  return (
    <div className="space-y-6">
      {/* Floating Toast for Errors */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 pointer-events-none">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg animate-fade-in pointer-events-auto">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* FORM: Novo / Editar Serviço — sempre visível, sem modal */}
      <div id="ob-servico-form" ref={formRef} className="bg-white border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 md:py-3.5 flex items-center gap-2"
          style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
        >
          <Sparkles className="w-6 h-6 md:w-5 md:h-5 text-white" />
          <h2 className="font-title font-semibold text-2xl md:text-xl text-white">
            {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
          </h2>
        </div>

        <form onSubmit={handleSaveServico} className="space-y-4 p-6">
          {/* Nome */}
          <div id="gt-servico-nome" className="space-y-1.5">
            <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Nome do Serviço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Volume Russo"
              value={servicoNome}
              onChange={(e) => setServicoNome(e.target.value)}
              className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
            />
          </div>

          {/* Preço & Duração */}
          <div className="grid grid-cols-2 gap-4">
            <div id="gt-servico-preco" className="space-y-1.5">
              <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Preço (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="0.00"
                value={servicoValor}
                onChange={(e) => setServicoValor(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
              />
            </div>
            <div id="gt-servico-duracao" className="space-y-1.5">
              <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Duração (min) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={servicoDuracao}
                onChange={(e) => setServicoDuracao(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          </div>

          {/* Toggle: dados opcionais */}
          <button
            type="button"
            onClick={() => setShowOptionalFields(prev => !prev)}
            className="flex items-center gap-1.5 text-sm md:text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 md:w-3.5 md:h-3.5 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`} />
            {showOptionalFields ? 'Ocultar dados opcionais' : 'Adicionar mais detalhes (opcional)'}
          </button>

          {showOptionalFields && (
            <div className="space-y-5 pt-1 animate-fade-in">
              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Descrição <span className="text-text-muted font-normal normal-case">(aparece no portal da cliente)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Ex: Fio sintético aplicado cílio a cílio. Efeito natural e discreto para o dia a dia."
                  value={servicoDescricao}
                  onChange={(e) => setServicoDescricao(e.target.value)}
                  maxLength={300}
                  className="w-full px-3.5 py-3 md:px-3 md:py-2 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted resize-none"
                />
                <p className="text-xs md:text-[11px] text-text-muted text-right">{servicoDescricao.length}/300</p>
              </div>

              {/* Foto do serviço */}
              <div className="space-y-2">
                <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Foto do Serviço <span className="text-text-muted font-normal normal-case">(opcional)</span>
                </label>
                <input
                  ref={imagemFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagemSelect}
                />
                {servicoImagemPreviewUrl ? (
                  <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-border group">
                    <img src={servicoImagemPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => imagemFileInputRef.current?.click()}
                        className="px-3.5 py-2 md:px-3 md:py-1.5 bg-white text-text-primary rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                      >
                        Trocar foto
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoverImagem}
                        className="px-3.5 py-2 md:px-3 md:py-1.5 bg-red-500 text-white rounded-lg text-sm md:text-xs font-semibold cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imagemFileInputRef.current?.click()}
                    className="w-full max-w-sm aspect-video rounded-xl border-2 border-dashed border-border hover:border-rose-300 hover:bg-rose-50/30 transition-colors flex flex-col items-center justify-center gap-2 text-text-muted cursor-pointer"
                  >
                    <ImagePlus className="w-8 h-8 md:w-7 md:h-7" />
                    <span className="text-sm md:text-xs font-medium">Clique para adicionar uma foto</span>
                    <span className="text-xs md:text-[10px]">A imagem será comprimida automaticamente</span>
                  </button>
                )}
              </div>

              {/* Preview: como vai aparecer no portal */}
              <div className="space-y-3 bg-bg/40 border border-border rounded-xl p-4">
                <div>
                  <p className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary mb-0.5">Como vai aparecer no portal</p>
                  <p className="text-xs md:text-[10px] text-text-muted">Atualiza em tempo real</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card preview — com imagem */}
                  <div>
                    <p className="text-xs md:text-[10px] font-medium text-text-muted mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      Com foto
                    </p>
                    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                      {servicoImagemPreviewUrl ? (
                        <img src={servicoImagemPreviewUrl} alt="Preview" className="w-full aspect-video object-cover" />
                      ) : (
                        <div className="w-full aspect-video bg-rose-50 flex items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-rose-200" />
                        </div>
                      )}
                      <div className="p-3 space-y-2">
                        <p className="font-title font-semibold text-sm text-text-primary leading-snug">
                          {servicoNome || 'Nome do Serviço'}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-400" />
                            {servicoDuracao || 0} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-amber-500" />
                            R$ {Number(servicoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="w-full py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold text-center">
                          Agendar
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card preview — sem imagem */}
                  <div>
                    <p className="text-xs md:text-[10px] font-medium text-text-muted mb-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                      Sem foto
                    </p>
                    <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm p-3 space-y-2">
                      <p className="font-title font-semibold text-sm text-text-primary leading-snug">
                        {servicoNome || 'Nome do Serviço'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-400" />
                          {servicoDuracao || 0} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-amber-500" />
                          R$ {Number(servicoValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold text-center">
                        Agendar
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs md:text-[10px] text-text-muted leading-relaxed pt-2 border-t border-border">
                  A foto é opcional. Serviços sem foto exibem o card no formato simples, como mostrado acima.
                </p>
              </div>
            </div>
          )}

          {servicoError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg">
              <AlertCircle className="w-5 h-5 md:w-4 md:h-4 flex-shrink-0 text-red-600" />
              <p className="text-sm md:text-xs font-medium">{servicoError}</p>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {editingServico && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-3.5 md:py-3 border border-border rounded-full md:rounded-xl text-base md:text-sm font-medium text-text-secondary hover:bg-bg transition-colors cursor-pointer"
              >
                Cancelar edição
              </button>
            )}
            <button
              type="submit"
              disabled={uploadingImagem}
              className="flex-1 flex items-center justify-center gap-1.5 py-3.5 md:py-3 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4" />
              {uploadingImagem ? 'Enviando imagem...' : editingServico ? 'Salvar Alterações' : 'Adicionar Serviço'}
            </button>
          </div>
        </form>
      </div>

      {/* Aviso: base de serviços de exemplo (mostrado só no primeiro acesso) */}
      {showExampleBanner && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[14px] p-4 sm:p-5">
          <div className="w-11 h-11 md:w-9 md:h-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 md:w-4 md:h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-base md:text-sm font-semibold text-amber-900">Esses são serviços de exemplo</p>
            <p className="text-sm md:text-xs text-amber-800 mt-0.5 leading-relaxed">
              Preparamos o Fio a Fio Clássico e o Volume Russo como base pra você já começar — são os serviços mais pedidos. Edite os preços e detalhes à vontade, ou apague e cadastre os seus.
            </p>
          </div>
          <button
            onClick={dismissExampleBanner}
            className="text-amber-600 hover:text-amber-800 flex-shrink-0 p-1 rounded-full hover:bg-amber-100 transition-colors cursor-pointer"
            aria-label="Fechar aviso"
          >
            <X className="w-5 h-5 md:w-4 md:h-4" />
          </button>
        </div>
      )}

      {/* LISTA: Seus Serviços */}
      <div className="bg-white border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 md:py-3.5 flex items-center gap-2"
          style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
        >
          <h3 className="font-title font-semibold text-xl md:text-lg text-white">
            Seus Serviços
          </h3>
          <span className="text-sm md:text-xs font-sans font-medium px-2.5 py-1 md:px-2 md:py-0.5 rounded-full bg-white/20 text-white">
            {servicos.length} cadastrado{servicos.length === 1 ? '' : 's'}
          </span>
        </div>
        <div className="p-5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar serviço por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 md:py-2 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
            <p className="text-base md:text-sm">Carregando serviços...</p>
          </div>
        ) : filteredServicos.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
              <WandSparkles className="w-7 h-7 text-rose-300" />
            </div>
            {servicos.length === 0 ? (
              <>
                <p className="font-title font-medium text-xl md:text-lg text-text-primary">Nenhum serviço ainda</p>
                <p className="text-base md:text-sm text-text-muted mt-1">Cadastre seu primeiro serviço acima para as clientes começarem a agendar.</p>
              </>
            ) : (
              <>
                <p className="font-title font-medium text-xl md:text-lg text-text-primary">Nenhum serviço encontrado</p>
                <p className="text-base md:text-sm text-text-muted mt-1">Experimente alterar os filtros de busca.</p>
              </>
            )}
          </div>
        ) : (
          <div id="ob-servicos-lista" className="divide-y divide-border rounded-b-[14px] overflow-hidden">
            {filteredServicos.map(serv => (
              <div
                key={serv.id}
                className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-6 transition-colors duration-150 hover:bg-bg/30"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex items-center justify-center flex-shrink-0">
                  {serv.imagem_url ? (
                    <img src={serv.imagem_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <WandSparkles className="w-5 h-5 text-rose-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary text-base truncate">{serv.nome}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:text-xs text-text-secondary mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 md:w-3.5 md:h-3.5 text-text-muted" />
                      {serv.duracao_minutos} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Coins className="w-4 h-4 md:w-3.5 md:h-3.5 text-text-muted" />
                      R$ {Number(serv.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleEditServico(serv)}
                    className="w-9 h-9 flex items-center justify-center text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors cursor-pointer"
                    title="Editar Serviço"
                  >
                    <Edit2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteServico(serv)}
                    className="w-9 h-9 flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    title="Excluir Serviço"
                  >
                    <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmModalConfig?.onConfirm || (() => {})}
        title={confirmModalConfig?.title || ''}
        description={confirmModalConfig?.description || ''}
        warningText={confirmModalConfig?.warningText}
        type="danger"
      />

      <ConfirmModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        onConfirm={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        description={successModal.description}
        type="success"
        confirmText="OK"
        singleAction
      />
    </div>
  );
}
