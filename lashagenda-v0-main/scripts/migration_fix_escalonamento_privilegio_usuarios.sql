-- =========================================================================
-- MIGRATION — Corrige escalonamento de privilégio via usuarios.role +
-- remove overload antigo de get_cliente_id_by_email_or_whatsapp
-- =========================================================================
-- Achado durante comparação do schema ao vivo com schema_definitivo.sql
-- (usando o Schema Visualizer + queries em pg_policies/pg_proc do
-- Supabase). Dois problemas reais encontrados:
--
-- 1) CRÍTICO — a política "usuarios_update" só verifica dono da linha
--    (id = auth.uid()), sem restringir coluna nenhuma. get_auth_user_role()
--    e get_auth_user_establishment() leem role/estabelecimento_id direto de
--    public.usuarios, ao vivo, sem nenhum cache no token de login. Ou seja:
--    qualquer sessão de cliente convidada — que QUALQUER visitante cria
--    sozinho, só completando um agendamento normal pelo link público, sem
--    precisar saber nada de ninguém — podia rodar
--      UPDATE usuarios SET role = 'profissional' WHERE id = auth.uid();
--    e, a partir da consulta seguinte, ganhar acesso total de profissional
--    à conta daquele estabelecimento (todas as clientes, serviços,
--    agendamentos, configurações, e até mudar o próprio plano pra premium
--    direto). Isso é mais grave que qualquer achado anterior da auditoria —
--    não exige conhecer nenhuma informação específica de ninguém.
--
--    Solução: trigger BEFORE UPDATE em usuarios que bloqueia sessão de
--    cliente alterando role/estabelecimento_id/cliente_id/id — libera só
--    nome, email, avatar_url e onboarding_paginas_vistas, que são os únicos
--    campos que a tela "Meu Perfil" da cliente realmente edita.
--
-- 2) ALTO — get_cliente_id_by_email_or_whatsapp(text,text,uuid) (a versão
--    ANTIGA, sem checagem de nome, de antes do fix de hoje cedo) continua
--    existindo no banco ao lado da nova versão de 4 parâmetros.
--    CREATE OR REPLACE só substitui função com a MESMA assinatura — como a
--    nova versão tem um parâmetro a mais, o Postgres criou uma função
--    sobrecarregada nova em vez de substituir a antiga, que ficou pra trás
--    ainda chamável. Isso permite contornar a exigência de nome só chamando
--    a função com 3 parâmetros em vez de 4.
--
-- Seguro para rodar em produção: trigger novo (não altera dados
-- existentes), DROP FUNCTION só remove a assinatura antiga específica —
-- a versão nova de 4 parâmetros não é afetada.
-- =========================================================================

-- 1. Trigger de restrição em usuarios
CREATE OR REPLACE FUNCTION public.restringir_update_usuario_por_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role = 'cliente' THEN
    IF NEW.role IS DISTINCT FROM OLD.role
    OR NEW.estabelecimento_id IS DISTINCT FROM OLD.estabelecimento_id
    OR NEW.cliente_id IS DISTINCT FROM OLD.cliente_id
    OR NEW.id IS DISTINCT FROM OLD.id
    THEN
      RAISE EXCEPTION 'Não é permitido alterar esses campos por autoatendimento.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restringir_update_usuario ON public.usuarios;
CREATE TRIGGER trg_restringir_update_usuario
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.restringir_update_usuario_por_role();

-- 2. Remove a versão antiga (3 parâmetros) de get_cliente_id_by_email_or_whatsapp
DROP FUNCTION IF EXISTS public.get_cliente_id_by_email_or_whatsapp(text, text, uuid);
