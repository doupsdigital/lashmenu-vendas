-- =========================================================================
-- LASHMENU + AGENDAMENTO: UNIFIED SCHEMA v1.0 (DEV & PRODUÇÃO)
-- =========================================================================
-- Execute este script no SQL Editor do projeto Supabase para criar/atualizar
-- todas as tabelas necessárias para o LashMenu com Agendamento Nativo.
-- =========================================================================

-- 1. TABELA DE CATÁLOGOS / ORDENS (LASH DESIGNERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id                                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                              TEXT        UNIQUE NOT NULL,
  client_name                       TEXT        NOT NULL,
  whatsapp                          TEXT,
  instagram                         TEXT,
  location                          TEXT,
  hero_phrase                       TEXT,
  model_id                          TEXT        DEFAULT 'glamour',
  color_id                          TEXT        DEFAULT 'midnight',
  cover_media_type                  TEXT        DEFAULT 'image',
  cover_media_url                   TEXT,
  agendamento_ativo                 BOOLEAN     DEFAULT false,
  antecedencia_cancelamento_horas   INTEGER     DEFAULT 24,
  mensagem_pos_agendamento          TEXT        DEFAULT 'Seu agendamento foi recebido! Aguarde a confirmação.',
  created_at                        TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna agendamento_ativo se a tabela orders já existir
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS agendamento_ativo BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS antecedencia_cancelamento_horas INTEGER DEFAULT 24;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mensagem_pos_agendamento TEXT DEFAULT 'Seu agendamento foi recebido! Aguarde a confirmação.';

-- 2. TABELA DE SERVIÇOS DO CATÁLOGO
CREATE TABLE IF NOT EXISTS public.order_services (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  price             NUMERIC(10,2),
  duration          TEXT,
  duracao_minutos   INTEGER     NOT NULL DEFAULT 60,
  category          TEXT,
  photo_url         TEXT,
  description       TEXT,
  effect            TEXT,
  maintenance       NUMERIC(10,2),
  order_index       INTEGER     DEFAULT 0,
  ativo             BOOLEAN     DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Garantir coluna duracao_minutos e ativo se a tabela order_services já existir
ALTER TABLE public.order_services ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER DEFAULT 60;
ALTER TABLE public.order_services ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 3. HORÁRIOS DE ATENDIMENTO DA LASH DESIGNER (GRADE SEMANAL)
CREATE TABLE IF NOT EXISTS public.horarios_atendimento (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  dia_semana        INTEGER     NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio       TIME        NOT NULL,
  hora_fim          TIME        NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_dia_semana_order UNIQUE (order_id, dia_semana)
);

-- 4. BLOQUEIOS DE AGENDA (FOLGAS, FÉRIAS, EMBARGO DE HORÁRIO)
CREATE TABLE IF NOT EXISTS public.bloqueios_agenda (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  data_inicio       DATE        NOT NULL,
  data_fim          DATE        NOT NULL,
  motivo            TEXT,
  dia_inteiro       BOOLEAN     DEFAULT true,
  hora_inicio       TIME,
  hora_fim          TIME,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 5. AGENDAMENTOS EFETUADOS PELAS CLIENTES FINAIS
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID        NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  service_id            UUID        REFERENCES public.order_services(id) ON DELETE SET NULL,
  nome_cliente          TEXT        NOT NULL,
  whatsapp_cliente      TEXT        NOT NULL,
  data_hora             TIMESTAMPTZ NOT NULL,
  duracao_minutos       INTEGER     NOT NULL DEFAULT 60,
  status                TEXT        NOT NULL DEFAULT 'pendente'
                        CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'concluido', 'falta')),
  origem                TEXT        DEFAULT 'catalogo' CHECK (origem IN ('catalogo', 'admin')),
  observacoes           TEXT,
  valor_cobrado         NUMERIC(10,2),
  created_at            TIMESTAMPTZ DEFAULT now()
);

-- Index de otimização de busca de slots por data e order
CREATE INDEX IF NOT EXISTS idx_agendamentos_order_data ON public.agendamentos(order_id, data_hora);

-- 6. FUNÇÃO RPC GET_SLOTS_OCUPADOS
CREATE OR REPLACE FUNCTION public.get_slots_ocupados(
  p_order_id UUID,
  p_data     DATE
)
RETURNS TABLE (data_hora TIMESTAMPTZ, duracao_minutos INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.data_hora, a.duracao_minutos
  FROM public.agendamentos a
  WHERE a.order_id = p_order_id
    AND a.data_hora::date = p_data
    AND a.status NOT IN ('cancelado', 'falta');
$$;

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horarios_atendimento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloqueios_agenda       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos           ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "orders_public_select" ON public.orders;
DROP POLICY IF EXISTS "orders_service_role_all" ON public.orders;
DROP POLICY IF EXISTS "order_services_public_select" ON public.order_services;
DROP POLICY IF EXISTS "order_services_service_role_all" ON public.order_services;
DROP POLICY IF EXISTS "horarios_public_select" ON public.horarios_atendimento;
DROP POLICY IF EXISTS "horarios_service_role_all" ON public.horarios_atendimento;
DROP POLICY IF EXISTS "bloqueios_public_select" ON public.bloqueios_agenda;
DROP POLICY IF EXISTS "bloqueios_service_role_all" ON public.bloqueios_agenda;
DROP POLICY IF EXISTS "agendamentos_public_insert" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_public_select" ON public.agendamentos;
DROP POLICY IF EXISTS "agendamentos_service_role_all" ON public.agendamentos;

-- Criar Políticas de Acesso
CREATE POLICY "orders_public_select" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "orders_service_role_all" ON public.orders FOR ALL TO service_role USING (true);

CREATE POLICY "order_services_public_select" ON public.order_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "order_services_service_role_all" ON public.order_services FOR ALL TO service_role USING (true);

CREATE POLICY "horarios_public_select" ON public.horarios_atendimento FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "horarios_service_role_all" ON public.horarios_atendimento FOR ALL TO service_role USING (true);

CREATE POLICY "bloqueios_public_select" ON public.bloqueios_agenda FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "bloqueios_service_role_all" ON public.bloqueios_agenda FOR ALL TO service_role USING (true);

CREATE POLICY "agendamentos_public_insert" ON public.agendamentos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "agendamentos_public_select" ON public.agendamentos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "agendamentos_service_role_all" ON public.agendamentos FOR ALL TO service_role USING (true);
