import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Eye,
  Sparkles,
  Clock,
  Moon,
  HeartPulse,
  ShieldAlert,
  Save,
  AlertCircle,
  CheckCircle,
  Circle,
  Pencil,
  X,
} from 'lucide-react';
import type { Cliente } from '../../types';
import { registrarLog } from '../../utils/log';
import { getInitials } from '../../utils/initials';

type SectionTone = 'rose' | 'amber' | 'red';

const SECTION_HEADER_BG: Record<SectionTone, React.CSSProperties['background']> = {
  rose: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)',
  amber: 'linear-gradient(to bottom right, #d97706 75%, #f59e0b 100%)',
  red: 'linear-gradient(to bottom right, #dc2626 75%, #ef4444 100%)',
};

const selectClass = "w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 cursor-pointer";
const inputClass = "w-full px-3.5 py-3 md:px-3 md:py-2.5 border border-border rounded-lg bg-bg text-text-primary text-base md:text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 placeholder:text-text-muted";
const checkboxLabelClass = "flex items-center gap-3 p-3 md:p-2.5 bg-bg/25 rounded-lg border border-border/40 cursor-pointer select-none flex-1 transition-colors hover:bg-bg/40";
const checkboxClass = "w-5 h-5 md:w-4.5 md:h-4.5 accent-rose-600 cursor-pointer";
const labelClass = "text-sm md:text-xs font-semibold text-text-secondary uppercase tracking-wider";
const checkboxTextClass = "text-sm md:text-xs font-medium text-text-secondary";
const filledValueClass = "inline-block px-3 py-2 md:px-2.5 md:py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-800 text-base md:text-sm font-semibold whitespace-pre-wrap";
const emptyValueClass = "text-base md:text-sm text-text-muted italic py-2";
const pencilBtnClass = "text-text-muted hover:text-rose-600 transition-colors cursor-pointer flex-shrink-0";

function AnamneseSection({
  icon: Icon,
  title,
  tone = 'rose',
  className = '',
  showActions = false,
  saving = false,
  onSave,
  onCancel,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone?: SectionTone;
  className?: string;
  showActions?: boolean;
  saving?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white border border-border rounded-[14px] shadow-sm overflow-hidden ${className}`}>
      <div className="px-5 py-4 md:py-3.5" style={{ background: SECTION_HEADER_BG[tone] }}>
        <h3 className="font-title font-bold text-xl md:text-lg text-white flex items-center gap-2">
          <Icon className="w-6 h-6 md:w-5 md:h-5 text-white flex-shrink-0" />
          {title}
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {children}
        {showActions && (
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60 animate-fade-in">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 px-4 py-2 md:px-3.5 md:py-1.5 rounded-lg bg-bg text-text-secondary hover:bg-border/40 text-sm md:text-xs font-semibold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 md:w-3.5 md:h-3.5" />
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 md:px-3.5 md:py-1.5 rounded-lg bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white text-sm md:text-xs font-semibold transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 md:w-3.5 md:h-3.5" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldLabel({ label, editing, onToggle }: { label: string; editing: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <label className={labelClass}>{label}</label>
      <button type="button" onClick={onToggle} className={pencilBtnClass} title={editing ? 'Fechar edição' : 'Editar'}>
        {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function SelectField({
  label, fieldKey, value, onChange, options, editingFields, onToggleEdit, className = '',
}: {
  label: string;
  fieldKey: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  editingFields: Set<string>;
  onToggleEdit: (key: string) => void;
  className?: string;
}) {
  const editing = editingFields.has(fieldKey);
  const selectedLabel = options.find((o) => o.value === value)?.label;
  return (
    <div className={`space-y-1.5 ${className}`}>
      <FieldLabel label={label} editing={editing} onToggle={() => onToggleEdit(fieldKey)} />
      {editing ? (
        <select value={value || ''} onChange={(e) => onChange(e.target.value)} className={selectClass} autoFocus={editingFields.size === 1}>
          <option value="">Selecione...</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : selectedLabel ? (
        <p className={filledValueClass}>{selectedLabel}</p>
      ) : (
        <p className={emptyValueClass}>Não informado</p>
      )}
    </div>
  );
}

function TextField({
  label, fieldKey, value, onChange, placeholder, editingFields, onToggleEdit, textarea = false, rows = 2, type = 'text', className = '', suffix = '',
}: {
  label: string;
  fieldKey: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  editingFields: Set<string>;
  onToggleEdit: (key: string) => void;
  textarea?: boolean;
  rows?: number;
  type?: string;
  className?: string;
  suffix?: string;
}) {
  const editing = editingFields.has(fieldKey);
  return (
    <div className={`space-y-1.5 ${className}`}>
      <FieldLabel label={label} editing={editing} onToggle={() => onToggleEdit(fieldKey)} />
      {editing ? (
        textarea ? (
          <textarea rows={rows} placeholder={placeholder} value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClass} autoFocus={editingFields.size === 1} />
        ) : (
          <input type={type} min={type === 'number' ? 0 : undefined} placeholder={placeholder} value={value || ''} onChange={(e) => onChange(e.target.value)} className={inputClass} autoFocus={editingFields.size === 1} />
        )
      ) : value ? (
        <p className={filledValueClass}>{value}{suffix}</p>
      ) : (
        <p className={emptyValueClass}>Não informado</p>
      )}
    </div>
  );
}

function CheckField({
  label, fieldKey, checked, onChange, editingFields, onToggleEdit, nested = false,
}: {
  label: string;
  fieldKey: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  editingFields: Set<string>;
  onToggleEdit: (key: string) => void;
  nested?: boolean;
}) {
  const editing = editingFields.has(fieldKey);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        {nested ? (
          <label className="flex items-center gap-3 p-3 md:p-2.5 bg-rose-50/20 rounded-lg border border-rose-100/40 cursor-pointer select-none flex-1 transition-colors hover:bg-rose-50/35 pl-6">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={checkboxClass} autoFocus={editingFields.size === 1} />
            <span className="text-sm md:text-xs font-semibold text-rose-800">{label}</span>
          </label>
        ) : (
          <label className={checkboxLabelClass}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className={checkboxClass} autoFocus={editingFields.size === 1} />
            <span className={checkboxTextClass}>{label}</span>
          </label>
        )}
        <button type="button" onClick={() => onToggleEdit(fieldKey)} className={pencilBtnClass} title="Fechar edição">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-3 p-3 md:p-2.5 rounded-lg border flex-1 ${nested ? 'pl-6' : ''} ${checked ? 'bg-rose-50 border-rose-200' : 'bg-bg/30 border-border/40'}`}>
        {checked ? (
          <CheckCircle className="w-5 h-5 md:w-4 md:h-4 text-rose-600 flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 md:w-4 md:h-4 text-text-muted/50 flex-shrink-0" />
        )}
        <span className={`text-sm md:text-xs font-medium ${checked ? 'text-rose-800 font-semibold' : 'text-text-muted'}`}>{label}</span>
      </div>
      <button type="button" onClick={() => onToggleEdit(fieldKey)} className={pencilBtnClass} title="Editar">
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}

const FORMATO_OLHO_OPTIONS = [
  { value: 'amendoado', label: 'Amendoado' },
  { value: 'redondo', label: 'Redondo' },
  { value: 'caido', label: 'Caído' },
  { value: 'fundo', label: 'Fundo' },
  { value: 'protruso', label: 'Protruso' },
  { value: 'monolid', label: 'Monolid' },
];
const ESPACAMENTO_OPTIONS = [
  { value: 'proximos', label: 'Próximos' },
  { value: 'afastados', label: 'Afastados' },
  { value: 'normal', label: 'Normal' },
];
const DENSIDADE_OPTIONS = [
  { value: 'ralos', label: 'Ralos' },
  { value: 'medios', label: 'Médios' },
  { value: 'densos', label: 'Densos' },
];
const COMPRIMENTO_CILIOS_OPTIONS = [
  { value: 'curtos', label: 'Curtos' },
  { value: 'medios', label: 'Médios' },
  { value: 'longos', label: 'Longos' },
];
const CURVATURA_NATURAL_OPTIONS = [
  { value: 'retos', label: 'Retos' },
  { value: 'levemente_curvados', label: 'Levemente curvados' },
  { value: 'bem_curvados', label: 'Bem curvados' },
];
const TECNICA_OPTIONS = [
  { value: 'fio_a_fio_classico', label: 'Fio a Fio Clássico' },
  { value: 'volume_russo', label: 'Volume Russo' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'volume_brasileiro', label: 'Volume Brasileiro' },
  { value: 'mega_volume', label: 'Mega Volume' },
];
const MAPPING_OPTIONS = [
  { value: 'natural', label: 'Natural' },
  { value: 'gatinho', label: 'Gatinho (Cat Eye)' },
  { value: 'boneca', label: 'Boneca (Dolly Eye)' },
  { value: 'esquilo', label: 'Esquilo (Squirrel)' },
  { value: 'aberto_no_meio', label: 'Aberto no Meio' },
];
const CURVATURA_PREF_OPTIONS = [
  { value: 'J', label: 'J' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'CC', label: 'CC' },
  { value: 'D', label: 'D' },
  { value: 'DD_L', label: 'D+ / L' },
  { value: 'L_plus_M', label: 'L+ / M' },
];
const ESPESSURA_OPTIONS = [
  { value: '0.03', label: '0.03mm' },
  { value: '0.05', label: '0.05mm' },
  { value: '0.07', label: '0.07mm' },
  { value: '0.10', label: '0.10mm' },
  { value: '0.15', label: '0.15mm' },
  { value: '0.20', label: '0.20mm' },
];
const EFEITO_OPTIONS = [
  { value: 'natural', label: 'Natural' },
  { value: 'glamouroso', label: 'Glamouroso' },
  { value: 'boneca', label: 'Boneca' },
  { value: 'marcante', label: 'Marcante' },
];
const POSICAO_DORMIR_OPTIONS = [
  { value: 'lado', label: 'De Lado (impacta lateral da extensão)' },
  { value: 'costas', label: 'De Costas (ideal para retenção)' },
  { value: 'de_brucos', label: 'De Bruços (atrito severo)' },
  { value: 'variada', label: 'Variada / Alternada' },
];
const ADESIVO_OPTIONS = [
  { value: 'sensivel', label: 'Sensível / Hipoalergênico' },
  { value: 'padrao', label: 'Padrão' },
  { value: 'secagem_rapida', label: 'Secagem Rápida' },
];

const PERFIL_OLHO_KEYS = ['formatoOlho', 'espacamentoOlhos', 'densidadeCiliosNaturais', 'comprimentoCiliosNaturais', 'curvaturaNatural'];
const PREFERENCIAS_KEYS = ['tecnicaPreferida', 'mappingPreferido', 'curvaturaPreferida', 'espessuraPreferida', 'comprimentoPredominante', 'efeitoDesejado'];
const RETENCAO_KEYS = ['posicaoDormir', 'tempoMedioRetencaoDias', 'frequenciaManutencaoDias', 'tipoAdesivo', 'maquiagemProvaAgua', 'exposicaoCalorAgua', 'observacoesRetencao'];
const HISTORICO_KEYS = ['fezExtensaoAntes', 'reacaoAlergicaAnterior', 'usaLentesContato', 'olhosSensiveis', 'doencasOculares', 'habitoEsfregarOlhos'];
const CONDICOES_KEYS = ['gestante', 'problemasTireoide', 'quimioterapiaRecente', 'quedaCabeloAlopecia'];
const ALERGIAS_KEYS = ['alergias', 'medicamentos', 'doencasCronicas', 'observacoes'];
const ALL_FIELD_KEYS = [...PERFIL_OLHO_KEYS, ...PREFERENCIAS_KEYS, ...RETENCAO_KEYS, ...HISTORICO_KEYS, ...CONDICOES_KEYS, ...ALERGIAS_KEYS];

function temFichaPreenchida(alergias: string | null | undefined, medicamentos: string | null | undefined, doencasCronicas: string | null | undefined, lash: Record<string, any>): boolean {
  if (alergias || medicamentos || doencasCronicas) return true;
  return Object.values(lash).some((v) => {
    if (typeof v === 'boolean') return v === true;
    if (typeof v === 'number') return v !== null;
    return !!v;
  });
}

export default function FichaAnamneseDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { estabelecimentoId } = useAuth();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());

  // Alergias & Detalhes Clínicos (colunas diretas da tabela clientes)
  const [alergias, setAlergias] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [doencasCronicas, setDoencasCronicas] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [gestante, setGestante] = useState(false);

  // Histórico & Cuidados Oculares
  const [fezExtensaoAntes, setFezExtensaoAntes] = useState(false);
  const [reacaoAlergicaAnterior, setReacaoAlergicaAnterior] = useState(false);
  const [usaLentesContato, setUsaLentesContato] = useState(false);
  const [olhosSensiveis, setOlhosSensiveis] = useState(false);
  const [doencasOculares, setDoencasOculares] = useState(false);
  const [habitoEsfregarOlhos, setHabitoEsfregarOlhos] = useState(false);

  // Condições Clínicas & Fatores Hormonais
  const [problemasTireoide, setProblemasTireoide] = useState(false);
  const [quimioterapiaRecente, setQuimioterapiaRecente] = useState(false);
  const [quedaCabeloAlopecia, setQuedaCabeloAlopecia] = useState(false);

  // Perfil do Olho & Cílios Naturais
  const [formatoOlho, setFormatoOlho] = useState<NonNullable<Cliente['anamnese_lash']>['formato_olho']>('');
  const [espacamentoOlhos, setEspacamentoOlhos] = useState<NonNullable<Cliente['anamnese_lash']>['espacamento_olhos']>('');
  const [densidadeCiliosNaturais, setDensidadeCiliosNaturais] = useState<NonNullable<Cliente['anamnese_lash']>['densidade_cilios_naturais']>('');
  const [comprimentoCiliosNaturais, setComprimentoCiliosNaturais] = useState<NonNullable<Cliente['anamnese_lash']>['comprimento_cilios_naturais']>('');
  const [curvaturaNatural, setCurvaturaNatural] = useState<NonNullable<Cliente['anamnese_lash']>['curvatura_natural']>('');

  // Preferências Técnicas
  const [tecnicaPreferida, setTecnicaPreferida] = useState<NonNullable<Cliente['anamnese_lash']>['tecnica_preferida']>('');
  const [mappingPreferido, setMappingPreferido] = useState<NonNullable<Cliente['anamnese_lash']>['mapping_preferido']>('');
  const [curvaturaPreferida, setCurvaturaPreferida] = useState<NonNullable<Cliente['anamnese_lash']>['curvatura_preferida']>('');
  const [espessuraPreferida, setEspessuraPreferida] = useState<NonNullable<Cliente['anamnese_lash']>['espessura_preferida']>('');
  const [comprimentoPredominante, setComprimentoPredominante] = useState('');
  const [efeitoDesejado, setEfeitoDesejado] = useState<NonNullable<Cliente['anamnese_lash']>['efeito_desejado']>('');

  // Retenção & Cuidados
  const [posicaoDormir, setPosicaoDormir] = useState<'lado' | 'costas' | 'de_brucos' | 'variada' | ''>('');
  const [maquiagemProvaAgua, setMaquiagemProvaAgua] = useState(false);
  const [exposicaoCalorAgua, setExposicaoCalorAgua] = useState(false);
  const [tempoMedioRetencaoDias, setTempoMedioRetencaoDias] = useState<string>('');
  const [frequenciaManutencaoDias, setFrequenciaManutencaoDias] = useState<string>('');
  const [tipoAdesivo, setTipoAdesivo] = useState<NonNullable<Cliente['anamnese_lash']>['tipo_adesivo']>('');
  const [observacoesRetencao, setObservacoesRetencao] = useState('');

  const showTemporaryError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const toggleFieldEdit = (key: string) => {
    setEditingFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const applyClienteData = (data: Cliente) => {
    setCliente(data);

    setAlergias(data.alergias || '');
    setMedicamentos(data.medicamentos || '');
    setDoencasCronicas(data.doencas_cronicas || '');
    setObservacoes(data.observacoes || '');
    setGestante(!!data.gestante);

    const lash = data.anamnese_lash || {};
    setFezExtensaoAntes(!!lash.fez_extensao_antes);
    setReacaoAlergicaAnterior(!!lash.reacao_alergica_anterior);
    setUsaLentesContato(!!lash.usa_lentes_contato);
    setOlhosSensiveis(!!lash.olhos_sensiveis);
    setDoencasOculares(!!lash.doencas_oculares);
    setHabitoEsfregarOlhos(!!lash.habito_esfregar_olhos);
    setProblemasTireoide(!!lash.problemas_tireoide);
    setQuimioterapiaRecente(!!lash.quimioterapia_recente);
    setQuedaCabeloAlopecia(!!lash.queda_cabelo_alopecia);

    setFormatoOlho(lash.formato_olho || '');
    setEspacamentoOlhos(lash.espacamento_olhos || '');
    setDensidadeCiliosNaturais(lash.densidade_cilios_naturais || '');
    setComprimentoCiliosNaturais(lash.comprimento_cilios_naturais || '');
    setCurvaturaNatural(lash.curvatura_natural || '');

    setTecnicaPreferida(lash.tecnica_preferida || '');
    setMappingPreferido(lash.mapping_preferido || '');
    setCurvaturaPreferida(lash.curvatura_preferida || '');
    setEspessuraPreferida(lash.espessura_preferida || '');
    setComprimentoPredominante(lash.comprimento_predominante || '');
    setEfeitoDesejado(lash.efeito_desejado || '');

    setPosicaoDormir(lash.posicao_dormir || '');
    setMaquiagemProvaAgua(!!lash.maquiagem_prova_agua);
    setExposicaoCalorAgua(!!lash.exposicao_calor_agua);
    setTempoMedioRetencaoDias(lash.tempo_medio_retencao_dias != null ? String(lash.tempo_medio_retencao_dias) : '');
    setFrequenciaManutencaoDias(lash.frequencia_manutencao_dias != null ? String(lash.frequencia_manutencao_dias) : '');
    setTipoAdesivo(lash.tipo_adesivo || '');
    setObservacoesRetencao(lash.observacoes_retencao || '');

    return { alergias: data.alergias, medicamentos: data.medicamentos, doencasCronicas: data.doencas_cronicas, lash };
  };

  const fetchCliente = async (showLoading = true) => {
    if (!id || !estabelecimentoId) return;
    if (showLoading) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', id)
        .eq('estabelecimento_id', estabelecimentoId)
        .single();

      if (error) throw error;
      const applied = applyClienteData(data);
      if (showLoading) {
        const hasData = temFichaPreenchida(applied.alergias, applied.medicamentos, applied.doencasCronicas, applied.lash);
        // Ficha vazia (cliente nova): abre tudo já em edição, sem exigir clicar
        // em lápis campo por campo pra começar a preencher.
        setEditingFields(hasData ? new Set() : new Set(ALL_FIELD_KEYS));
      }
    } catch (err) {
      console.error('Erro ao buscar ficha da cliente:', err);
      showTemporaryError('Falha ao carregar a ficha de anamnese.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCliente();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, estabelecimentoId]);

  // Salvar/Cancelar de qualquer card afeta a ficha inteira (é um registro só no
  // banco), mesmo que outros cards também tenham campos abertos pra edição.
  const handleCancelEdit = () => {
    if (cliente) applyClienteData(cliente);
    setEditingFields(new Set());
  };

  const handleSave = async () => {
    if (!cliente) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('clientes')
        .update({
          alergias: alergias.trim() || null,
          medicamentos: medicamentos.trim() || null,
          doencas_cronicas: doencasCronicas.trim() || null,
          observacoes: observacoes.trim() || null,
          gestante,
          anamnese_lash: {
            fez_extensao_antes: fezExtensaoAntes,
            reacao_alergica_anterior: reacaoAlergicaAnterior,
            usa_lentes_contato: usaLentesContato,
            olhos_sensiveis: olhosSensiveis,
            doencas_oculares: doencasOculares,
            habito_esfregar_olhos: habitoEsfregarOlhos,
            problemas_tireoide: problemasTireoide,
            quimioterapia_recente: quimioterapiaRecente,
            queda_cabelo_alopecia: quedaCabeloAlopecia,

            formato_olho: formatoOlho,
            espacamento_olhos: espacamentoOlhos,
            densidade_cilios_naturais: densidadeCiliosNaturais,
            comprimento_cilios_naturais: comprimentoCiliosNaturais,
            curvatura_natural: curvaturaNatural,

            tecnica_preferida: tecnicaPreferida,
            mapping_preferido: mappingPreferido,
            curvatura_preferida: curvaturaPreferida,
            espessura_preferida: espessuraPreferida,
            comprimento_predominante: comprimentoPredominante.trim() || null,
            efeito_desejado: efeitoDesejado,

            posicao_dormir: posicaoDormir,
            maquiagem_prova_agua: maquiagemProvaAgua,
            exposicao_calor_agua: exposicaoCalorAgua,
            tempo_medio_retencao_dias: tempoMedioRetencaoDias ? Number(tempoMedioRetencaoDias) : null,
            frequencia_manutencao_dias: frequenciaManutencaoDias ? Number(frequenciaManutencaoDias) : null,
            tipo_adesivo: tipoAdesivo,
            observacoes_retencao: observacoesRetencao.trim() || null,
          },
        })
        .eq('id', cliente.id);

      if (error) throw error;

      const clientName = `${cliente.nome} ${cliente.sobrenome || ''}`.trim();
      await registrarLog('editou', 'cliente', cliente.id, `Atualizou a ficha de anamnese de "${clientName}"`);
      await fetchCliente(false);
      setEditingFields(new Set());
      setSuccessMessage('Ficha de anamnese atualizada com sucesso!');
    } catch (err) {
      console.error(err);
      showTemporaryError('Falha ao salvar a ficha de anamnese.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-text-secondary bg-white border border-border rounded-[14px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mb-2" />
        <p className="text-base md:text-sm">Carregando ficha de anamnese...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="bg-white border border-border rounded-[14px] p-12 text-center text-text-secondary">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="font-title font-medium text-xl md:text-lg text-text-primary">Cliente não encontrada</p>
        <Link
          to="/fichas-anamnese"
          className="mt-4 inline-flex items-center gap-1 px-4 py-2.5 md:py-2 bg-rose-600 text-white rounded-lg text-sm md:text-xs font-medium hover:bg-rose-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a lista
        </Link>
      </div>
    );
  }

  const initials = getInitials(cliente.nome, cliente.sobrenome);
  const hasEditing = (keys: string[]) => keys.some((k) => editingFields.has(k));

  return (
    <div className="space-y-6">
      {/* Floating Alerts */}
      {errorMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-black/20 backdrop-blur-[1px]">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl flex items-center gap-3 shadow-2xl max-w-md">
            <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-600" />
            <p className="text-base md:text-sm">{errorMessage}</p>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-[14px] border border-border shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-green-600">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div className="space-y-1">
              <h3 className="font-title font-bold text-2xl md:text-xl text-text-primary">Salvo com Sucesso!</h3>
              <p className="text-sm md:text-xs text-text-secondary leading-relaxed">{successMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="w-full py-3 md:py-2.5 bg-rose-600 hover:bg-rose-800 text-white rounded-lg text-sm md:text-xs font-semibold transition-colors cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="rounded-[14px] p-5 md:p-6 shadow-sm text-white"
        style={{ background: 'linear-gradient(to bottom right, var(--rose-600) 75%, var(--rose-400) 100%)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 md:w-12 md:h-12 rounded-full bg-rose-100 border-2 border-white/40 text-rose-800 flex items-center justify-center font-title font-bold text-lg md:text-base flex-shrink-0">
              {initials}
            </div>
            <h2 className="font-title font-semibold text-2xl md:text-xl leading-snug ph-mask">
              {cliente.nome} {cliente.sobrenome}
            </h2>
          </div>
          <Link
            to="/fichas-anamnese"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 md:px-3 md:py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-sm md:text-xs font-semibold text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 md:w-3.5 md:h-3.5" />
            Voltar
          </Link>
        </div>
      </div>

      {/* Toda a ficha é mascarada na gravação de sessão: mistura dados de
          preferência estética com dados de saúde (alergias, gestante,
          doenças crônicas) — dado sensível pela LGPD (art. 5º, II). */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ph-mask">

        {/* Perfil do Olho & Cílios Naturais */}
        <AnamneseSection
          icon={Eye} title="Perfil do Olho & Cílios Naturais" tone="rose" className="md:col-span-2"
          showActions={hasEditing(PERFIL_OLHO_KEYS)} saving={saving} onSave={handleSave} onCancel={handleCancelEdit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField label="Formato do olho" fieldKey="formatoOlho" value={formatoOlho} onChange={(v) => setFormatoOlho(v as any)} options={FORMATO_OLHO_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Espaçamento entre os olhos" fieldKey="espacamentoOlhos" value={espacamentoOlhos} onChange={(v) => setEspacamentoOlhos(v as any)} options={ESPACAMENTO_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Densidade dos cílios naturais" fieldKey="densidadeCiliosNaturais" value={densidadeCiliosNaturais} onChange={(v) => setDensidadeCiliosNaturais(v as any)} options={DENSIDADE_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Comprimento dos cílios naturais" fieldKey="comprimentoCiliosNaturais" value={comprimentoCiliosNaturais} onChange={(v) => setComprimentoCiliosNaturais(v as any)} options={COMPRIMENTO_CILIOS_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Curvatura natural" fieldKey="curvaturaNatural" value={curvaturaNatural} onChange={(v) => setCurvaturaNatural(v as any)} options={CURVATURA_NATURAL_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
          </div>
        </AnamneseSection>

        {/* Preferências Técnicas */}
        <AnamneseSection
          icon={Sparkles} title="Preferências Técnicas" tone="rose" className="md:col-span-2"
          showActions={hasEditing(PREFERENCIAS_KEYS)} saving={saving} onSave={handleSave} onCancel={handleCancelEdit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField label="Técnica preferida" fieldKey="tecnicaPreferida" value={tecnicaPreferida} onChange={(v) => setTecnicaPreferida(v as any)} options={TECNICA_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Mapping preferido" fieldKey="mappingPreferido" value={mappingPreferido} onChange={(v) => setMappingPreferido(v as any)} options={MAPPING_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Curvatura preferida" fieldKey="curvaturaPreferida" value={curvaturaPreferida} onChange={(v) => setCurvaturaPreferida(v as any)} options={CURVATURA_PREF_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Espessura preferida" fieldKey="espessuraPreferida" value={espessuraPreferida} onChange={(v) => setEspessuraPreferida(v as any)} options={ESPESSURA_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <TextField label="Comprimento predominante" fieldKey="comprimentoPredominante" value={comprimentoPredominante} onChange={setComprimentoPredominante} placeholder="Ex: 8-13mm" editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Efeito desejado" fieldKey="efeitoDesejado" value={efeitoDesejado} onChange={(v) => setEfeitoDesejado(v as any)} options={EFEITO_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
          </div>
        </AnamneseSection>

        {/* Retenção & Cuidados */}
        <AnamneseSection
          icon={Clock} title="Retenção & Cuidados" tone="rose" className="md:col-span-2"
          showActions={hasEditing(RETENCAO_KEYS)} saving={saving} onSave={handleSave} onCancel={handleCancelEdit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField label="Como costuma dormir?" fieldKey="posicaoDormir" value={posicaoDormir} onChange={(v) => setPosicaoDormir(v as any)} options={POSICAO_DORMIR_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <TextField label="Tempo médio de retenção (dias)" fieldKey="tempoMedioRetencaoDias" value={tempoMedioRetencaoDias} onChange={setTempoMedioRetencaoDias} placeholder="Ex: 21" type="number" suffix=" dias" editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <TextField label="Frequência ideal de manutenção (dias)" fieldKey="frequenciaManutencaoDias" value={frequenciaManutencaoDias} onChange={setFrequenciaManutencaoDias} placeholder="Ex: 15" type="number" suffix=" dias" editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <SelectField label="Adesivo mais adequado" fieldKey="tipoAdesivo" value={tipoAdesivo} onChange={(v) => setTipoAdesivo(v as any)} options={ADESIVO_OPTIONS} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Usa rímel ou maquiagem à prova d'água?" fieldKey="maquiagemProvaAgua" checked={maquiagemProvaAgua} onChange={setMaquiagemProvaAgua} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Contato frequente com vapor, calor ou piscina?" fieldKey="exposicaoCalorAgua" checked={exposicaoCalorAgua} onChange={setExposicaoCalorAgua} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <TextField
              label="Observações sobre retenção"
              fieldKey="observacoesRetencao"
              value={observacoesRetencao}
              onChange={setObservacoesRetencao}
              placeholder="Ex: Perde mais fios no canto externo. Boa retenção no geral."
              textarea
              rows={2}
              editingFields={editingFields}
              onToggleEdit={toggleFieldEdit}
              className="sm:col-span-2 lg:col-span-3"
            />
          </div>
        </AnamneseSection>

        {/* Histórico & Cuidados Oculares */}
        <AnamneseSection
          icon={Moon} title="Histórico & Cuidados Oculares" tone="amber"
          showActions={hasEditing(HISTORICO_KEYS)} saving={saving} onSave={handleSave} onCancel={handleCancelEdit}
        >
          <div className="space-y-3">
            <CheckField label="Já realizou extensão de cílios anteriormente?" fieldKey="fezExtensaoAntes" checked={fezExtensaoAntes} onChange={setFezExtensaoAntes} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            {fezExtensaoAntes && (
              <CheckField label="Teve reação alérgica a extensões anteriores?" fieldKey="reacaoAlergicaAnterior" checked={reacaoAlergicaAnterior} onChange={setReacaoAlergicaAnterior} editingFields={editingFields} onToggleEdit={toggleFieldEdit} nested />
            )}
            <CheckField label="Usa lentes de contato?" fieldKey="usaLentesContato" checked={usaLentesContato} onChange={setUsaLentesContato} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Olhos sensíveis, lacrimejamento fácil ou olho seco?" fieldKey="olhosSensiveis" checked={olhosSensiveis} onChange={setOlhosSensiveis} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Infecção ocular recente (blefarite, conjuntivite, terçol)?" fieldKey="doencasOculares" checked={doencasOculares} onChange={setDoencasOculares} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Hábito de esfregar ou tocar os olhos/cílios?" fieldKey="habitoEsfregarOlhos" checked={habitoEsfregarOlhos} onChange={setHabitoEsfregarOlhos} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
          </div>
        </AnamneseSection>

        {/* Condições Clínicas & Fatores Hormonais */}
        <AnamneseSection
          icon={HeartPulse} title="Condições Clínicas & Fatores Hormonais" tone="red"
          showActions={hasEditing(CONDICOES_KEYS)} saving={saving} onSave={handleSave} onCancel={handleCancelEdit}
        >
          <div className="space-y-3">
            <CheckField label="Gestante ou Lactante?" fieldKey="gestante" checked={gestante} onChange={setGestante} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Problemas de tireoide ou alteração hormonal recente?" fieldKey="problemasTireoide" checked={problemasTireoide} onChange={setProblemasTireoide} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Passou por quimioterapia nos últimos 6 meses?" fieldKey="quimioterapiaRecente" checked={quimioterapiaRecente} onChange={setQuimioterapiaRecente} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <CheckField label="Queda acentuada de cabelo ou diagnóstico de alopecia?" fieldKey="quedaCabeloAlopecia" checked={quedaCabeloAlopecia} onChange={setQuedaCabeloAlopecia} editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
          </div>
        </AnamneseSection>

        {/* Alergias & Detalhes Clínicos */}
        <AnamneseSection
          icon={ShieldAlert} title="Alergias & Detalhes Clínicos" tone="red" className="md:col-span-2"
          showActions={hasEditing(ALERGIAS_KEYS)} saving={saving} onSave={handleSave} onCancel={handleCancelEdit}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="Alergias conhecidas" fieldKey="alergias" value={alergias} onChange={setAlergias} placeholder="Ex: Esmalte, cosméticos, cianoacrilato (cola), fita micropore, látex..." editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <TextField label="Medicamentos em uso" fieldKey="medicamentos" value={medicamentos} onChange={setMedicamentos} placeholder="Ex: Roacutan, colírios frequentes, corticoides..." editingFields={editingFields} onToggleEdit={toggleFieldEdit} />
            <TextField label="Doenças Crônicas" fieldKey="doencasCronicas" value={doencasCronicas} onChange={setDoencasCronicas} placeholder="Ex: Diabetes, labirintite (dificulta ficar deitada muito tempo), asma..." editingFields={editingFields} onToggleEdit={toggleFieldEdit} className="sm:col-span-2" />
            <TextField
              label="Notas gerais"
              fieldKey="observacoes"
              value={observacoes}
              onChange={setObservacoes}
              placeholder="Qualquer observação adicional relevante sobre a cliente..."
              textarea
              rows={3}
              editingFields={editingFields}
              onToggleEdit={toggleFieldEdit}
              className="sm:col-span-2"
            />
          </div>
        </AnamneseSection>

      </div>
    </div>
  );
}
