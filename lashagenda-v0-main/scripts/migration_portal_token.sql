-- =========================================================================
-- MIGRATION — Token permanente para reabrir o app instalado (PWA) direto
-- no portal da cliente, sem tela de login
-- =========================================================================
-- Problema: no iOS, quando a cliente instala o app pela tela "Adicionar à
-- Tela de Início" do Safari, o app instalado roda numa instância de
-- armazenamento local (localStorage) ISOLADA do Safari — a sessão anônima
-- criada durante o agendamento como convidada não é herdada por ele. Ao abrir
-- o ícone, o app fica sem sessão e cai na tela de login da profissional
-- (não existe mais login de cliente).
--
-- Solução: gerar, para cada cliente, um token permanente (independente de
-- localStorage) que viaja embutido na própria URL de instalação do app
-- (via manifest.json dinâmico — ver Edge Function portal-manifest). Ao abrir
-- o app pela primeira vez, a rota /portal/:slug/app/:token valida esse token
-- e cria uma nova sessão anônima vinculada à mesma cliente.
--
-- Seguro para rodar em produção: adiciona uma coluna com DEFAULT (não altera
-- dados existentes) e uma função nova (CREATE OR REPLACE).
-- =========================================================================

-- 1. Token permanente por cliente (gerado automaticamente para todas as
--    clientes já existentes e para as novas).
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS portal_token UUID NOT NULL DEFAULT gen_random_uuid();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_portal_token_key'
  ) THEN
    ALTER TABLE public.clientes
      ADD CONSTRAINT clientes_portal_token_key UNIQUE (portal_token);
  END IF;
END $$;

-- 2. RPC pública para validar o token e obter os dados necessários para
--    reabrir a sessão da cliente (usada pela rota /portal/:slug/app/:token).
--    SECURITY DEFINER: contorna RLS (anon não tem SELECT em clientes por id).
CREATE OR REPLACE FUNCTION public.get_cliente_by_portal_token(
  p_slug  TEXT,
  p_token UUID
)
RETURNS TABLE(cliente_id UUID, nome TEXT, estabelecimento_id UUID)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.nome, c.estabelecimento_id
  FROM public.clientes c
  JOIN public.estabelecimentos e ON e.id = c.estabelecimento_id
  WHERE c.portal_token = p_token
    AND e.slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_cliente_by_portal_token TO anon, authenticated;
