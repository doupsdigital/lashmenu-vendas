-- =========================================================================
-- MIGRATION — Exige nome bater, além do WhatsApp, pra reconectar uma
-- cliente convidada ao cadastro existente
-- =========================================================================
-- Problema: get_cliente_id_by_email_or_whatsapp reconectava a sessão de uma
-- cliente ao cadastro existente só pelo número de WhatsApp digitado — sem
-- checar o nome. Bastava alguém saber o WhatsApp de uma cliente específica
-- (link do portal daquela profissional + número dela) pra "virar" a sessão
-- dela e, a partir daí, acessar histórico de agendamentos e dados do perfil
-- pela API do Supabase.
--
-- Solução: passa a exigir também que o nome digitado bata com o nome já
-- cadastrado. Compara "nome + sobrenome" concatenados (não só a coluna
-- nome), porque a tela "Meu Perfil" da cliente guarda nome e sobrenome
-- separados assim que ela salva uma vez — enquanto o cadastro por convidada
-- e o cadastro manual da profissional guardam tudo junto na coluna nome.
-- Comparar só "nome" quebraria o reconhecimento de qualquer cliente que já
-- tivesse editado o próprio perfil (reabriria o bug de duplicidade corrigido
-- em migration_fix_dedup_cliente_convidada.sql).
--
-- Não fecha 100% do risco (alguém que souber nome completo E WhatsApp exato
-- ainda consegue), mas cobre o cenário mais realista de alguém que só tem o
-- número, com uma mudança pequena e fácil de testar.
--
-- Seguro para rodar em produção: CREATE OR REPLACE, `p_nome` tem DEFAULT ''
-- pra não quebrar chamadas antigas (sem esse parâmetro) durante a janela
-- entre o deploy do banco e o deploy do frontend.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.get_cliente_id_by_email_or_whatsapp(
  p_email              TEXT,
  p_whatsapp_digits    TEXT,
  p_estabelecimento_id UUID,
  p_nome               TEXT DEFAULT ''
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

  -- 2ª tentativa: fallback por WhatsApp (apenas dígitos) quando sem email —
  -- exige também que o nome digitado bata com nome + sobrenome cadastrados.
  SELECT c.id INTO v_id
  FROM public.clientes c
  WHERE REGEXP_REPLACE(c.whatsapp, '[^0-9]', '', 'g') = p_whatsapp_digits
    AND c.estabelecimento_id = p_estabelecimento_id
    AND (c.email IS NULL OR c.email = '')
    AND LOWER(TRIM(CONCAT_WS(' ', c.nome, c.sobrenome))) = LOWER(TRIM(p_nome))
  LIMIT 1;

  RETURN v_id;
END;
$$;
