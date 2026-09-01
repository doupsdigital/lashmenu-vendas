-- =========================================================================
-- MIGRATION — Corrige duplicação de cadastro ao agendar como convidada de
-- um dispositivo/navegador novo
-- =========================================================================
-- Problema: get_cliente_id_by_email_or_whatsapp só reaproveitava o cadastro
-- existente por WhatsApp se a cliente AINDA NÃO tivesse uma conta de acesso
-- vinculada (usuarios). Só que toda sessão anônima criada no primeiro
-- agendamento já gera essa conta automaticamente — então, a partir do
-- segundo agendamento feito de um dispositivo/navegador sem sessão salva
-- (ex: navegador interno do Instagram, celular trocado, cache limpo), a
-- busca por WhatsApp deixava de encontrar a cliente e um cadastro duplicado
-- era criado. Resultado: a profissional via a mesma cliente duas vezes na
-- lista, e a cliente perdia a visão do próprio histórico em "Meus
-- Agendamentos" (ficava preso no cadastro antigo, inacessível sem o link/
-- token daquele primeiro dispositivo).
--
-- Solução: remove a restrição — a busca por WhatsApp volta a valer sempre,
-- reaproveitando o cadastro existente independente de já ter conta de
-- acesso vinculada.
--
-- Trade-off aceito conscientemente: um estranho que souber o nome completo e
-- o WhatsApp exato de uma cliente específica poderia, em teoria, ver o
-- histórico/perfil dela ao "agendar" com esses dados. Dado de baixo risco
-- (agenda e contato, não é senha nem pagamento nem dado clínico) e produto
-- ainda em estágio inicial — decisão tomada cientes desse ponto.
--
-- Seguro para rodar em produção: CREATE OR REPLACE, não altera dados
-- existentes, não precisa recriar a GRANT (permissão já concedida antes).
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_cliente_id_by_email_or_whatsapp(
  p_email              TEXT,
  p_whatsapp_digits    TEXT,
  p_estabelecimento_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- 1ª tentativa: match por email
  SELECT id INTO v_id
  FROM public.clientes
  WHERE LOWER(email) = LOWER(p_email)
    AND estabelecimento_id = p_estabelecimento_id
  LIMIT 1;

  IF v_id IS NOT NULL THEN
    RETURN v_id;
  END IF;

  -- 2ª tentativa: fallback por WhatsApp (apenas dígitos) quando sem email
  SELECT c.id INTO v_id
  FROM public.clientes c
  WHERE REGEXP_REPLACE(c.whatsapp, '[^0-9]', '', 'g') = p_whatsapp_digits
    AND c.estabelecimento_id = p_estabelecimento_id
    AND (c.email IS NULL OR c.email = '')
  LIMIT 1;

  RETURN v_id;
END;
$$;
