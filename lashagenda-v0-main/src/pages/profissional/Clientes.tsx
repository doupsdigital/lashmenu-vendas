import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import posthog from 'posthog-js';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../hooks/useOnboarding';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  Plus,
  Search,
  AlertCircle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import type { Cliente } from '../../types';
import { registrarLog } from '../../utils/log';
import { getInitials } from '../../utils/initials';

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const limited = digits.substring(0, 11);
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 7) return `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
  return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`;
}

function applyCpfMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const limited = digits.substring(0, 11);
  if (limited.length <= 3) return limited;
  if (limited.length <= 6) return `${limited.substring(0, 3)}.${limited.substring(3)}`;
  if (limited.length <= 9) return `${limited.substring(0, 3)}.${limited.substring(3, 6)}.${limited.substring(6)}`;
  return `${limited.substring(0, 3)}.${limited.substring(3, 6)}.${limited.substring(6, 9)}-${limited.substring(9)}`;
}

export default function Clientes() {
  const navigate = useNavigate();
  const { estabelecimentoId, profile } = useAuth();
  const { autoStart } = useOnboarding('clientes');
  useEffect(() => { if (profile) autoStart(); }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form States
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('nome', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      showTemporaryError('Falha ao carregar clientes do banco.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const resetForm = () => {
    setNome('');
    setWhatsapp('');
    setEmail('');
    setDataNascimento('');
    setCpf('');
    setEndereco('');
  };

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !whatsapp.trim()) {
      showTemporaryError('Nome e WhatsApp são obrigatórios.');
      return;
    }

    try {
      // 1. Check if WhatsApp is unique within this establishment
      const { data: existing, error: checkError } = await supabase
        .from('clientes')
        .select('id')
        .eq('whatsapp', whatsapp)
        .eq('estabelecimento_id', estabelecimentoId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        showTemporaryError('Já existe um cliente cadastrado com este número de WhatsApp.');
        return;
      }

      // 2. Insert new client with establishment_id
      const clientPayload = {
        nome,
        whatsapp,
        email: email.trim() || null,
        data_nascimento: dataNascimento || null,
        cpf: cpf.trim() || null,
        endereco: endereco.trim() || null,
        estabelecimento_id: estabelecimentoId,
      };

      const { data: newClient, error: insertError } = await supabase
        .from('clientes')
        .insert(clientPayload)
        .select()
        .single();

      if (insertError) throw insertError;
      if (!newClient) throw new Error('Erro ao salvar cliente.');

      await registrarLog('criou', 'cliente', newClient.id, `Cadastrou o cliente "${nome}"`);
      posthog.capture('primeiro_cliente_cadastrado');
      const nomeCadastrado = nome;
      resetForm();
      fetchData();
      setSuccessModal({
        isOpen: true,
        title: 'Cliente cadastrada!',
        description: `${nomeCadastrado} foi cadastrada com sucesso.`,
      });
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao salvar o cliente.');
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);

    try {
      // 1. Delete associated attendances
      await supabase.from('atendimentos').delete().eq('cliente_id', clientToDelete.id);

      // 2. Delete associated appointments
      await supabase.from('agendamentos').delete().eq('cliente_id', clientToDelete.id);

      // 3. Delete associated user if exists
      await supabase.from('usuarios').delete().eq('cliente_id', clientToDelete.id);

      // 4. Finally delete client
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) throw error;

      await registrarLog('excluiu', 'cliente', clientToDelete.id, `Excluiu a cliente "${clientToDelete.name}"`);
      setClientToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err);
      showTemporaryError(err.message || 'Falha ao excluir o cliente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenWhatsApp = (whatsapp: string) => {
    const digits = whatsapp.replace(/\D/g, '');
    if (!digits) return;
    window.open(`https://wa.me/55${digits}`, '_blank');
  };

  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const filteredClientes = clientes.filter(client => {
    const fullName = normalize(`${client.nome} ${client.sobrenome || ''}`);
    const searchDigits = searchTerm.replace(/\D/g, '');
    return (
      fullName.includes(normalize(searchTerm)) ||
      (searchDigits.length > 0 && (client.whatsapp || '').replace(/\D/g, '').includes(searchDigits))
    );
  });

  // Paginated clients calculation
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

      {/* Nova Cliente — formulário inline */}
      <div id="ob-clientes-add-btn" className="bg-white border border-border rounded-[14px] shadow-sm overflow-hidden">
        <div
          className="px-6 py-4 md:py-3.5 flex items-center gap-2"
          style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
        >
          <UserPlus className="w-6 h-6 md:w-5 md:h-5 text-white" />
          <h2 className="font-title font-semibold text-2xl md:text-xl text-white">
            Nova Cliente
          </h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Amanda Oliveira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-3.5 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
              WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Ex: (11) 99999-9999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(applyPhoneMask(e.target.value))}
              className="w-full px-3.5 py-3.5 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowOptionalFields(prev => !prev)}
            className="flex items-center gap-1.5 text-sm md:text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 md:w-3.5 md:h-3.5 transition-transform ${showOptionalFields ? 'rotate-180' : ''}`} />
            {showOptionalFields ? 'Ocultar dados opcionais' : 'Adicionar mais detalhes (opcional)'}
          </button>

          {showOptionalFields && (
            <div className="space-y-4 pt-1 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="maria@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3.5 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-3.5 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  CPF
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(applyCpfMask(e.target.value))}
                  className="w-full px-3.5 py-3.5 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm md:text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade..."
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3.5 py-3.5 md:px-3 md:py-2.5 border border-border rounded-xl bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 py-4 md:py-3 bg-rose-600 hover:bg-rose-800 text-white rounded-full md:rounded-xl text-base md:text-sm font-bold md:font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4" />
            Cadastrar Cliente
          </button>
        </form>
      </div>

      {/* Cadastro Automático — some quando ela já tem clientes suficientes
          (de qualquer origem) pra ter entendido como funciona. Só avalia
          depois que os clientes carregarem, senão pisca na tela: `clientes`
          começa vazio (length 0, "< 3") até a busca no banco terminar. */}
      {!loading && clientes.length < 3 && (
        <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-5 flex items-start gap-3">
          <div className="w-11 h-11 md:w-9 md:h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Sparkles className="w-5 h-5 md:w-4 md:h-4" />
          </div>
          <div>
            <p className="font-semibold text-base md:text-sm text-amber-900">Cadastro Automático</p>
            <p className="text-sm md:text-xs text-amber-800 mt-1.5 md:mt-1 leading-relaxed">
              Não se preocupe em cadastrar todas as suas clientes manualmente! Conforme elas forem agendando pelo seu{' '}
              <span className="font-semibold text-amber-900">link de agendamento</span>, o sistema criará o cadastro de cada uma automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Sua Lista */}
      <div id="ob-clientes-lista" className="bg-white border border-border rounded-[14px] overflow-hidden shadow-sm">
        <div
          className="px-6 py-4 md:py-3.5 flex items-center gap-2.5"
          style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
        >
          <h2 className="font-title font-semibold text-2xl md:text-xl text-white">Sua Lista</h2>
          <span className="text-sm md:text-xs font-semibold px-3 py-1.5 md:px-2.5 md:py-1 rounded-full bg-white/20 text-white">
            {filteredClientes.length} cadastrados
          </span>
        </div>
        <div className="p-5 border-b border-border">
          <div id="ob-clientes-search" className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 md:w-4 md:h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome ou WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 md:py-2 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2"></div>
            <p className="text-base md:text-sm">Carregando clientes...</p>
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-12 text-center text-text-secondary">
            <UserPlus className="w-12 h-12 text-rose-200 mx-auto mb-3" />
            <p className="font-title font-medium text-xl md:text-lg text-text-primary">Nenhum cliente ainda</p>
            <p className="text-base md:text-sm text-text-muted mt-1">
              Os clientes aparecerão aqui quando você cadastrar ou quando eles agendarem pelo link público.
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-border ph-mask">
              {paginatedClientes.map(client => {
                const initials = getInitials(client.nome, client.sobrenome);

                return (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/clientes/${client.id}`)}
                    className="flex items-center gap-3 px-5 py-4 hover:bg-bg/25 transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-rose-100 border border-rose-200 text-rose-800 flex items-center justify-center font-title font-semibold text-base md:text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base md:text-sm font-semibold text-text-primary group-hover:text-rose-600 transition-colors truncate">
                        {client.nome} {client.sobrenome}
                      </p>
                      <p className="text-sm md:text-xs text-text-muted truncate">{client.whatsapp}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => client.whatsapp && handleOpenWhatsApp(client.whatsapp)}
                        disabled={!client.whatsapp}
                        className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-5 h-5 md:w-4 md:h-4" />
                      </button>
                      <button
                        onClick={() => setClientToDelete({ id: client.id, name: `${client.nome} ${client.sobrenome || ''}` })}
                        className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-bg text-text-secondary hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Excluir Cliente"
                      >
                        <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between text-sm md:text-xs text-text-secondary bg-rose-50/5">
                <span>Página {currentPage} de {totalPages} ({filteredClientes.length} total)</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 md:p-1.5 border border-border rounded-lg bg-white hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 md:p-1.5 border border-border rounded-lg bg-white hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {clientToDelete && createPortal(<div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-md flex flex-col p-6 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h4 className="font-title font-semibold text-xl md:text-lg text-text-primary">
                  Confirmar Exclusão
                </h4>
                <p className="text-sm md:text-xs text-text-secondary leading-relaxed">
                  Tem certeza que deseja excluir permanentemente a cliente <span className="font-semibold text-text-primary">{clientToDelete.name}</span>?
                  Esta ação irá apagar definitivamente o cadastro e todo o seu histórico de atendimentos e agendamentos, e não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-border">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 md:py-2 border border-border rounded-lg text-sm md:text-xs font-medium text-text-secondary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={isDeleting}
                className="px-4 py-2.5 md:py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg text-sm md:text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>, document.body)}

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
