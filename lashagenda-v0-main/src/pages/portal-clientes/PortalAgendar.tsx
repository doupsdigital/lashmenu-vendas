import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, Calendar, Clock, Tag,
  CheckCircle, AlertCircle, Loader2, Heart, User,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Servico, HorarioAtendimento, BloqueioAgenda } from '../../types';
import { usePortal } from '../../contexts/PortalContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ItemSelecionado {
  servico: Servico;
}

type Etapa = 1 | 2 | 3 | 4 | 'sucesso';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_SEMANA_LONGO = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
const MESES_GENITIVO = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function formatDuracao(min: number): string {
  if (min <= 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

function formatValor(val: number): string {
  return `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function applyPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const limited = digits.substring(0, 11);
  if (limited.length <= 2) return `(${limited}`;
  if (limited.length <= 7) return `(${limited.substring(0, 2)}) ${limited.substring(2)}`;
  return `(${limited.substring(0, 2)}) ${limited.substring(2, 7)}-${limited.substring(7)}`;
}

function dateToStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDataExtenso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS_SEMANA_LONGO[date.getDay()]}, ${d} de ${MESES_GENITIVO[m - 1]} de ${y}`;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMin(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function getDuracaoEfetiva(item: ItemSelecionado): number {
  return item.servico.duracao_minutos;
}

function getValorEfetivo(item: ItemSelecionado): number {
  return Number(item.servico.valor);
}

function gerarSlots(
  horaInicio: string,
  horaFim: string,
  duracaoTotal: number,
  agendamentos: { data_hora: string; duracao_minutos: number }[],
  bloqueiosDoDia: BloqueioAgenda[],
): string[] {
  if (duracaoTotal <= 0) return [];
  const ini = toMin(horaInicio);
  const fim = toMin(horaFim);
  const slots: string[] = [];

  for (let t = ini; t + duracaoTotal <= fim; t += 30) {
    const slotFim = t + duracaoTotal;
    const ocupadoPorAgendamento = agendamentos.some(ag => {
      // Usa Date para converter UTC → hora local corretamente
      const d = new Date(ag.data_hora);
      const agIni = d.getHours() * 60 + d.getMinutes();
      const agFim = agIni + ag.duracao_minutos;
      return t < agFim && slotFim > agIni;
    });

    if (ocupadoPorAgendamento) continue;

    const ocupadoPorBloqueio = bloqueiosDoDia.some(b => {
      if (b.dia_inteiro !== false) return true;
      if (!b.hora_inicio || !b.hora_fim) return false;
      const bIni = toMin(b.hora_inicio.substring(0, 5));
      const bFim = toMin(b.hora_fim.substring(0, 5));
      return t < bFim && slotFim > bIni;
    });

    if (!ocupadoPorBloqueio) slots.push(fromMin(t));
  }

  return slots;
}

// ─── Progress indicator ───────────────────────────────────────────────────────

const LABELS_ETAPA = ['Serviços', 'Data', 'Horário', 'Confirmação'];

function IndicadorProgresso({ etapaAtual }: { etapaAtual: number }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {LABELS_ETAPA.map((label, i) => {
        const num = i + 1;
        const ativa = num === etapaAtual;
        const concluida = num < etapaAtual;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                concluida
                  ? 'bg-rose-600 text-white'
                  : ativa
                  ? 'bg-rose-600 text-white ring-4 ring-rose-100'
                  : 'bg-gray-100 text-text-muted'
              }`}>
                {concluida ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                ativa ? 'text-rose-600' : concluida ? 'text-text-secondary' : 'text-text-muted'
              }`}>
                {label}
              </span>
            </div>
            {i < LABELS_ETAPA.length - 1 && (
              <div className={`w-10 sm:w-16 h-0.5 mx-1 mb-4 sm:mb-5 transition-colors ${
                concluida ? 'bg-rose-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PortalAgendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, clienteId, portalToken } = useAuth();
  const { establishmentId, slug } = usePortal();

  // Capture the query param only once at mount
  const preSelectedId = useRef(searchParams.get('servico')).current;

  const [etapa, setEtapa] = useState<Etapa>(1);

  // Depois que a cliente vê a confirmação, leva ela para a URL que carrega o
  // token permanente dela (ver PortalEntrarApp). É lá, com o token já na URL,
  // que ela normalmente vê o banner "Instalar App" — assim, se ela instalar o
  // app nesse momento, ele vai reabrir direto com os dados dela carregados.
  //
  // Importante: precisa ser uma navegação de verdade (window.location), não
  // navigate() do React Router. O Safari usa a URL do último carregamento real
  // de página para "Adicionar à Tela de Início" — troca feita só via
  // history.pushState/replaceState (como o navigate() faz) é ignorada por ele.
  // O atraso dá tempo dela ler a tela de confirmação antes do redirecionamento
  // (se ela tocar em algum botão da tela antes disso, o componente desmonta e
  // o timer é cancelado, sem redirecionar por cima da página que ela escolheu).
  useEffect(() => {
    if (etapa === 'sucesso' && slug && portalToken) {
      const timer = setTimeout(() => {
        window.location.replace(`/portal/${slug}/app/${portalToken}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [etapa, slug, portalToken]);

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loadingServicos, setLoadingServicos] = useState(true);
  const [selecionados, setSelecionados] = useState<Map<string, ItemSelecionado>>(new Map());

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const [horarios, setHorarios] = useState<HorarioAtendimento[]>([]);
  const [bloqueios, setBloqueios] = useState<BloqueioAgenda[]>([]);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [calendarioCarregado, setCalendarioCarregado] = useState(false);
  const hoje = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [mesAtual, setMesAtual] = useState({ year: hoje.getFullYear(), month: hoje.getMonth() });
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);

  // ── Step 3 ──────────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string | null>(null);

  // ── Step 4 ──────────────────────────────────────────────────────────────────
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<'generic' | 'race' | 'perm' | null>(null);
  const [nomeConvidado, setNomeConvidado] = useState('');
  const [whatsappConvidado, setWhatsappConvidado] = useState('');
  const [erroConvidado, setErroConvidado] = useState<string | null>(null);

  // ── Success ──────────────────────────────────────────────────────────────────
  const [mensagemPos, setMensagemPos] = useState('Obrigada pelo seu agendamento!');
  const [foiConfirmado, setFoiConfirmado] = useState(false);

  // ─── Computed values ─────────────────────────────────────────────────────────

  const itens = useMemo(() => Array.from(selecionados.values()), [selecionados]);

  const duracaoTotal = useMemo(
    () => itens.reduce((acc, it) => acc + getDuracaoEfetiva(it), 0),
    [itens],
  );

  const valorTotal = useMemo(
    () => itens.reduce((acc, it) => acc + getValorEfetivo(it), 0),
    [itens],
  );

  const podeAvancar1 = itens.length > 0;

  const diasDoMes = useMemo(() => {
    const { year, month } = mesAtual;
    const primeiroDia = new Date(year, month, 1).getDay();
    const diasNoMes = new Date(year, month + 1, 0).getDate();
    const dias: (Date | null)[] = [];
    for (let i = 0; i < primeiroDia; i++) dias.push(null);
    for (let d = 1; d <= diasNoMes; d++) dias.push(new Date(year, month, d));
    while (dias.length % 7 !== 0) dias.push(null);
    return dias;
  }, [mesAtual]);

  // ─── Data fetching ────────────────────────────────────────────────────────────

  // Step 1: services + pre-selection
  useEffect(() => {
    if (!establishmentId) return;
    (async () => {
      setLoadingServicos(true);
      try {
        const { data, error: servError } = await supabase
          .from('servicos')
          .select('*')
          .eq('estabelecimento_id', establishmentId)
          .order('nome', { ascending: true });

        if (servError) throw servError;

        const mapped: Servico[] = data || [];

        setServicos(mapped);

        if (preSelectedId) {
          const serv = mapped.find(s => s.id === preSelectedId);
          if (serv) {
            setSelecionados(new Map([[serv.id, { servico: serv }]]));
            setEtapa(2);
          }
        }
      } finally {
        setLoadingServicos(false);
      }
    })();
  }, [establishmentId]);

  // Step 2: calendar data (loaded once on first entry)
  useEffect(() => {
    if (etapa !== 2 || calendarioCarregado || !establishmentId) return;

    (async () => {
      setLoadingCalendario(true);
      try {
        const [horRes, bloqRes] = await Promise.all([
          supabase.from('horarios_atendimento').select('*').eq('estabelecimento_id', establishmentId),
          supabase.from('bloqueios_agenda').select('*').eq('estabelecimento_id', establishmentId),
        ]);
        setHorarios(horRes.data || []);
        setBloqueios(bloqRes.data || []);
        setCalendarioCarregado(true);
      } finally {
        setLoadingCalendario(false);
      }
    })();
  }, [etapa, calendarioCarregado, establishmentId]);

  // Step 3: compute available slots
  useEffect(() => {
    if (etapa !== 3 || !dataSelecionada || horarios.length === 0 || !establishmentId) return;

    (async () => {
      setLoadingSlots(true);
      setHorarioSelecionado(null);
      try {
        const [y, m, d] = dataSelecionada.split('-').map(Number);
        const diaSemana = new Date(y, m - 1, d).getDay();
        const horarioDia = horarios.find(h => h.dia_semana === diaSemana);

        if (!horarioDia) { setSlots([]); return; }

        // Usa função SECURITY DEFINER para contornar RLS e buscar slots ocupados do dia
        const { data: agData } = await supabase
          .rpc('get_slots_ocupados', {
            p_estabelecimento_id: establishmentId,
            p_data: dataSelecionada,
          });

        const blocksForDay = bloqueios.filter(b => dataSelecionada >= b.data_inicio && dataSelecionada <= b.data_fim);
        let slotsDosDia = gerarSlots(horarioDia.hora_inicio, horarioDia.hora_fim, duracaoTotal, agData || [], blocksForDay);

        // Filtra slots passados quando a data for hoje (buffer de 30 min de antecedência)
        if (dataSelecionada === dateToStr(new Date())) {
          const agora = new Date();
          const limiteMin = agora.getHours() * 60 + agora.getMinutes() + 30;
          slotsDosDia = slotsDosDia.filter(slot => toMin(slot) > limiteMin);
        }

        setSlots(slotsDosDia);
      } finally {
        setLoadingSlots(false);
      }
    })();
  }, [etapa, dataSelecionada, horarios, duracaoTotal, establishmentId]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  function toggleServico(serv: Servico) {
    setSelecionados(prev => {
      const next = new Map(prev);
      if (next.has(serv.id)) next.delete(serv.id);
      else next.set(serv.id, { servico: serv });
      return next;
    });
  }

  function isDiaDisponivel(date: Date): boolean {
    if (date < hoje) return false;
    if (!horarios.some(h => h.dia_semana === date.getDay())) return false;
    const ds = dateToStr(date);
    if (bloqueios.some(b => b.dia_inteiro !== false && ds >= b.data_inicio && ds <= b.data_fim)) return false;
    return true;
  }

  async function criarAgendamento(targetClienteId: string) {
    if (!dataSelecionada || !horarioSelecionado) return;

    setSalvando(true);
    setErroSalvar(null);

    try {
      // 1. Read config
      const { data: config } = await supabase
        .from('configuracao_negocio')
        .select('aprovacao_automatica, mensagem_pos_agendamento')
        .eq('estabelecimento_id', establishmentId)
        .maybeSingle();

      const aprovAuto = config?.aprovacao_automatica ?? false;
      const msg = config?.mensagem_pos_agendamento || 'Obrigada pelo seu agendamento!';

      // 2. Re-verify slot (race condition check)
      const [yy, mm, dd] = dataSelecionada.split('-').map(Number);
      const diaSemana = new Date(yy, mm - 1, dd).getDay();
      const horarioDia = horarios.find(h => h.dia_semana === diaSemana);

      if (horarioDia) {
        // Re-verifica usando a mesma função SECURITY DEFINER (race condition check)
        const { data: agRecentes } = await supabase
          .rpc('get_slots_ocupados', {
            p_estabelecimento_id: establishmentId,
            p_data: dataSelecionada,
          });

        const blocksForDay = bloqueios.filter(b => dataSelecionada >= b.data_inicio && dataSelecionada <= b.data_fim);
        const slotsAtuais = gerarSlots(
          horarioDia.hora_inicio,
          horarioDia.hora_fim,
          duracaoTotal,
          agRecentes || [],
          blocksForDay,
        );

        if (!slotsAtuais.includes(horarioSelecionado)) {
          setSlots(slotsAtuais);
          setHorarioSelecionado(null);
          setErroSalvar('race');
          setEtapa(3);
          return;
        }
      }

      // 3. Insert agendamento — UUID gerado no cliente para evitar SELECT após INSERT
      const agendamentoId = crypto.randomUUID();

      // Converte horário local → UTC (igual ao painel da profissional)
      const dataHoraISO = new Date(`${dataSelecionada}T${horarioSelecionado}:00`).toISOString();

      const { error: agError } = await supabase
        .from('agendamentos')
        .insert({
          id: agendamentoId,
          cliente_id: targetClienteId,
          estabelecimento_id: establishmentId,
          data_hora: dataHoraISO,
          duracao_minutos: duracaoTotal,
          status: aprovAuto ? 'confirmado' : 'pendente',
          origem: 'portal',
          observacoes: null,
          valor_cobrado: valorTotal,
        });

      if (agError) throw agError;

      // 4. Insert agendamento_servicos com Rollback
      try {
        for (const item of itens) {
          const { error: asError } = await supabase
            .from('agendamento_servicos')
            .insert({
              agendamento_id: agendamentoId,
              servico_id: item.servico.id,
              valor_cobrado: getValorEfetivo(item),
            });
          if (asError) throw asError;
        }
      } catch (err) {
        // Rollback: Deleta o agendamento recém-criado caso a inserção dos serviços falhe
        await supabase
          .from('agendamentos')
          .delete()
          .eq('id', agendamentoId);
        throw err;
      }

      setMensagemPos(aprovAuto ? 'Seu agendamento foi confirmado!' : msg);
      setFoiConfirmado(aprovAuto);
      setEtapa('sucesso');
    } catch (err: unknown) {
      console.error('Erro ao confirmar agendamento:', err);
      const msg =
        err instanceof Error
          ? err.message
          : err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '';
      const code =
        err && typeof err === 'object' && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';

      // 23P01 = exclusion_violation (constraint de sobreposição do banco)
      if (code === '23P01' || msg.includes('no_overlap') || msg.includes('overlap')) {
        // Horário foi tomado enquanto a cliente confirmava — recarrega slots e volta para etapa 3
        const { data: agErr } = await supabase
          .rpc('get_slots_ocupados', {
            p_estabelecimento_id: establishmentId,
            p_data: dataSelecionada as string,
          });
        const [yyy, mmm, ddd] = (dataSelecionada as string).split('-').map(Number);
        const diaSemErr = new Date(yyy, mmm - 1, ddd).getDay();
        const horarioDiaErr = horarios.find(h => h.dia_semana === diaSemErr);
        if (horarioDiaErr) {
          const blocksErr = bloqueios.filter(b => (dataSelecionada as string) >= b.data_inicio && (dataSelecionada as string) <= b.data_fim);
          let slotsErr = gerarSlots(horarioDiaErr.hora_inicio, horarioDiaErr.hora_fim, duracaoTotal, agErr || [], blocksErr);
          if ((dataSelecionada as string) === dateToStr(new Date())) {
            const agora = new Date();
            const limiteMin = agora.getHours() * 60 + agora.getMinutes() + 30;
            slotsErr = slotsErr.filter(slot => toMin(slot) > limiteMin);
          }
          setSlots(slotsErr);
        }
        setHorarioSelecionado(null);
        setErroSalvar('race');
        setEtapa(3);
      } else if (msg.includes('permission') || msg.includes('policy') || msg.includes('violat') || msg.includes('42501')) {
        setErroSalvar('perm');
      } else {
        setErroSalvar('generic');
      }
    } finally {
      setSalvando(false);
    }
  }

  // Cliente já autenticada (conta completa ou sessão de convidada anterior)
  async function confirmarAgendamento() {
    if (!clienteId) return;
    await criarAgendamento(clienteId);
  }

  // Agendamento como convidada — sem conta prévia, só nome + WhatsApp.
  // Cria uma sessão anônima (auth.uid() real) e reaproveita todo o fluxo/RLS
  // já existente para clientes autenticadas.
  async function confirmarComoConvidado() {
    if (!establishmentId || !dataSelecionada || !horarioSelecionado) return;

    const nome = nomeConvidado.trim();
    const whatsappDigits = whatsappConvidado.replace(/\D/g, '');

    if (!nome || whatsappDigits.length < 10) {
      setErroConvidado('Preencha seu nome completo e um WhatsApp válido com DDD.');
      return;
    }

    setErroConvidado(null);
    setSalvando(true);
    setErroSalvar(null);

    try {
      // 1. Verifica se já existe uma cliente cadastrada com esse WhatsApp
      //    (cadastro manual da profissional ou agendamento anterior como convidada)
      const { data: existingId } = await supabase
        .rpc('get_cliente_id_by_email_or_whatsapp', {
          p_email: '',
          p_whatsapp_digits: whatsappDigits,
          p_estabelecimento_id: establishmentId,
          p_nome: nome,
        });

      let targetClienteId = existingId as string | null;

      // 2. Se não existe, cria o registro de cliente (RLS já libera insert anônimo)
      if (!targetClienteId) {
        targetClienteId = crypto.randomUUID();
        const { error: clientError } = await supabase.from('clientes').insert({
          id: targetClienteId,
          nome,
          whatsapp: whatsappConvidado,
          estabelecimento_id: establishmentId,
        });
        if (clientError) {
          // 23505 = violação do índice único de WhatsApp — outra aba/dispositivo
          // criou o mesmo cadastro entre o passo 1 e este insert (corrida rara,
          // ex: duplo toque ou duas abas abertas). Reaproveita quem ganhou a
          // corrida em vez de falhar o agendamento de quem perdeu.
          if (clientError.code === '23505') {
            const { data: raceWinnerId } = await supabase
              .rpc('get_cliente_id_by_email_or_whatsapp', {
                p_email: '',
                p_whatsapp_digits: whatsappDigits,
                p_estabelecimento_id: establishmentId,
                p_nome: nome,
              });
            if (!raceWinnerId) throw clientError;
            targetClienteId = raceWinnerId as string;
          } else {
            throw clientError;
          }
        }
      }

      // 3. Cria a sessão anônima vinculada a essa cliente
      const { error: authError } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            role: 'cliente',
            nome,
            cliente_id: targetClienteId,
            estabelecimento_id: establishmentId,
          },
        },
      });
      if (authError) throw authError;

      await criarAgendamento(targetClienteId);
    } catch (err) {
      console.error('Erro ao agendar como convidada:', err);
      setErroSalvar('generic');
      setSalvando(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (etapa === 'sucesso') {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-5 max-w-md mx-auto w-full" style={{ minHeight: 'calc(100svh - 9rem)' }}>
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
          <Heart className="w-8 h-8 text-rose-600 fill-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="font-title text-2xl font-bold text-text-primary">{mensagemPos}</h2>
          <p className={`text-sm font-medium ${foiConfirmado ? 'text-green-600' : 'text-amber-600'}`}>
            {foiConfirmado
              ? 'Acompanhe os detalhes em Meus Agendamentos.'
              : 'Seu agendamento está pendente de confirmação.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full">
          <button
            onClick={() => navigate(`/portal/${slug}/meus-agendamentos`)}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Ver meus agendamentos
          </button>
          <button
            onClick={() => navigate(`/portal/${slug}/catalogo`)}
            className="flex-1 py-2.5 border border-border text-text-secondary hover:bg-bg rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            Voltar ao catálogo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <h1 className="font-title font-bold text-3xl text-text-primary">Agendar Serviço</h1>

      <IndicadorProgresso etapaAtual={etapa as number} />

      {/* ─── ETAPA 1 — Serviços ───────────────────────────────────────────────── */}
      {etapa === 1 && (
        <div id="ob-portal-servico-select" className="space-y-5">
          {loadingServicos ? (
            <div className="flex flex-col items-center py-16 gap-3 text-text-secondary">
              <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
              <p className="text-sm">Carregando serviços...</p>
            </div>
          ) : servicos.length === 0 ? (
            <p className="text-center text-text-muted py-16">Nenhum serviço disponível no momento.</p>
          ) : (
            <>
              <div className="bg-white border border-border rounded-2xl overflow-hidden">
                <div className="divide-y divide-border">
                  {servicos.map(serv => {
                    const isChecked = selecionados.has(serv.id);
                    return (
                      <div key={serv.id} className={`transition-colors ${isChecked ? 'bg-rose-600' : ''}`}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => toggleServico(serv)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleServico(serv); } }}
                          className="relative flex items-center gap-4 p-4 sm:p-5 pr-24 sm:pr-28 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-inset"
                        >
                          {/* Thumbnail */}
                          <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border ${isChecked ? 'border-white/50' : 'border-border'} bg-rose-50 flex items-center justify-center`}>
                            {serv.imagem_url ? (
                              <img src={serv.imagem_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Heart className="w-5 h-5 text-rose-200" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className={`font-semibold text-base truncate ${isChecked ? 'text-white' : 'text-text-primary'}`}>{serv.nome}</p>
                            <span className={`flex items-center gap-1 text-xs ${isChecked ? 'text-white/90' : 'text-text-secondary'}`}>
                              <Clock className={`w-3.5 h-3.5 ${isChecked ? 'text-white/80' : 'text-rose-400'}`} />
                              {formatDuracao(serv.duracao_minutos)}
                            </span>
                            {serv.descricao && (
                              <p className={`text-xs truncate ${isChecked ? 'text-white/80' : 'text-text-secondary'}`}>{serv.descricao}</p>
                            )}
                          </div>

                          {/* Preço — destaque no canto inferior direito */}
                          <span
                            className={`absolute right-4 sm:right-5 bottom-3 sm:bottom-4 font-title font-bold text-lg ${
                              isChecked ? 'text-white' : 'text-rose-700'
                            }`}
                          >
                            {formatValor(serv.valor)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumo dinâmico */}
              {itens.length > 0 && (
                <div className="bg-rose-50/40 border border-rose-200 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Resumo da seleção
                  </h4>
                  {itens.map(it => (
                    <div key={it.servico.id} className="flex justify-between text-sm text-text-secondary">
                      <span>
                        {it.servico.nome}
                      </span>
                      <span className="font-medium text-text-primary">{formatValor(getValorEfetivo(it))}</span>
                    </div>
                  ))}
                  <div className="border-t border-rose-200 pt-3 flex justify-between text-sm font-semibold text-text-primary">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-rose-400" />
                      {formatDuracao(duracaoTotal)}
                    </span>
                    <span>{formatValor(valorTotal)}</span>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* ─── ETAPA 2 — Calendário ─────────────────────────────────────────────── */}
      {etapa === 2 && (
        <div id="ob-portal-calendario" className="space-y-5">
          <div className="bg-white border border-border rounded-2xl p-5">
            {loadingCalendario ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
              </div>
            ) : (
              <>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={() => setMesAtual(prev => {
                      const d = new Date(prev.year, prev.month - 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })}
                    className="p-1.5 rounded-lg hover:bg-bg text-text-secondary hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-title font-semibold text-lg text-text-primary">
                    {MESES_PT[mesAtual.month]} {mesAtual.year}
                  </h3>
                  <button
                    onClick={() => setMesAtual(prev => {
                      const d = new Date(prev.year, prev.month + 1, 1);
                      return { year: d.getFullYear(), month: d.getMonth() };
                    })}
                    className="p-1.5 rounded-lg hover:bg-bg text-text-secondary hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Day-of-week header */}
                <div className="grid grid-cols-7 mb-1">
                  {DIAS_SEMANA_PT.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-text-muted py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {diasDoMes.map((date, i) => {
                    if (!date) return <div key={i} />;
                    const disponivel = isDiaDisponivel(date);
                    const ds = dateToStr(date);
                    const selecionado = ds === dataSelecionada;
                    const isHoje = date.getTime() === hoje.getTime();
                    return (
                      <button
                        key={i}
                        disabled={!disponivel}
                        onClick={() => {
                          setDataSelecionada(ds);
                          setEtapa(3);
                        }}
                        className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          selecionado
                            ? 'bg-rose-600 text-white'
                            : disponivel
                            ? `text-text-primary hover:bg-rose-50 hover:text-rose-600 cursor-pointer${isHoje ? ' ring-2 ring-rose-300' : ''}`
                            : 'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* ─── ETAPA 3 — Horários ───────────────────────────────────────────────── */}
      {etapa === 3 && (
        <div id="ob-portal-horarios" className="space-y-5">
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
              <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
              <p className="text-sm font-medium text-text-secondary">
                {dataSelecionada ? formatDataExtenso(dataSelecionada) : ''}
              </p>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm">
                  Não há horários disponíveis para esta data. Escolha outra data.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setHorarioSelecionado(slot)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      horarioSelecionado === slot
                        ? 'bg-rose-600 text-white'
                        : 'bg-bg hover:bg-rose-50 hover:text-rose-600 text-text-primary border border-border'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {erroSalvar === 'race' && (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Este horário acabou de ser reservado. Por favor, escolha outro horário.
            </div>
          )}

        </div>
      )}

      {/* ─── ETAPA 4 — Confirmação ────────────────────────────────────────────── */}
      {etapa === 4 && (
        <div id="ob-portal-resumo" className="space-y-5">
          {/* Seus dados — só para quem ainda não tem sessão (agendamento como convidada) */}
          {!user && (
            <div className="bg-white border-2 border-rose-300 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-rose-50 px-5 py-4 border-b border-rose-200">
                <h3 className="font-title font-bold text-xl text-rose-800 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Seus dados
                </h3>
                <p className="text-sm text-rose-700/90 mt-0.5">Preencha para confirmar seu agendamento</p>
              </div>

              <div className="p-5 space-y-4">
                {erroConvidado && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {erroConvidado}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-text-secondary block">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maria Silva"
                    value={nomeConvidado}
                    onChange={e => setNomeConvidado(e.target.value)}
                    className="w-full px-3.5 py-3 border border-border rounded-xl bg-bg text-text-primary text-base focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold uppercase tracking-wider text-text-secondary block">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="(11) 99999-9999"
                    value={whatsappConvidado}
                    onChange={e => setWhatsappConvidado(applyPhoneMask(e.target.value))}
                    className="w-full px-3.5 py-3 border border-border rounded-xl bg-bg text-text-primary text-base focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-title font-semibold text-lg text-text-primary">
              Resumo do agendamento
            </h3>

            <div className="space-y-2">
              {itens.map(it => (
                <div key={it.servico.id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    {it.servico.nome}
                  </span>
                  <span className="font-medium text-text-primary">{formatValor(getValorEfetivo(it))}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <Calendar className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                <span>{dataSelecionada ? formatDataExtenso(dataSelecionada) : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{horarioSelecionado}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Clock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Duração: {formatDuracao(duracaoTotal)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Tag className="w-4 h-4 text-gold shrink-0" />
                <span>Total: {formatValor(valorTotal)}</span>
              </div>
            </div>
          </div>

          {erroSalvar && erroSalvar !== 'race' && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {erroSalvar === 'perm'
                ? 'Ocorreu um erro de permissão. Atualize a página e tente novamente.'
                : 'Não foi possível realizar o agendamento. Tente novamente.'}
            </div>
          )}

        </div>
      )}

      {/* ─── BARRA DE AÇÃO FIXA ───────────────────────────────────────────────── */}
      <div
          className="fixed left-0 right-0 z-20 bg-white border-t border-border flex items-center justify-between gap-3 px-4"
          style={{
            bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
            paddingTop: '12px',
            paddingBottom: '12px',
          }}
        >
          {/* Voltar */}
          {etapa === 1 ? (
            <div />
          ) : (
            <button
              onClick={() => {
                if (etapa === 2) setEtapa(1);
                else if (etapa === 3) { setErroSalvar(null); setEtapa(2); }
                else if (etapa === 4) setEtapa(3);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-border text-text-secondary hover:bg-bg rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          )}

          {/* Ação primária */}
          {etapa === 1 && (
            <button
              disabled={!podeAvancar1}
              onClick={() => setEtapa(2)}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-200 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Continuar
            </button>
          )}
          {etapa === 3 && slots.length > 0 && (
            <button
              disabled={!horarioSelecionado}
              onClick={() => { setErroSalvar(null); setEtapa(4); }}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-200 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Continuar
            </button>
          )}
          {etapa === 4 && (
            <button
              disabled={salvando}
              onClick={() => (user ? confirmarAgendamento() : confirmarComoConvidado())}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              {salvando ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Confirmar Agendamento</>
              )}
            </button>
          )}
        </div>
    </div>
  );
}
