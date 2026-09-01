-- =========================================================================
-- LASH AGENDA — LIMPEZA DOS DADOS DEMO
--
-- Apaga tudo que foi criado pelo seed_demo.sql.
--
-- Não dá pra confiar só no ON DELETE CASCADE de estabelecimentos: ele apaga
-- servicos/agendamentos "em paralelo", mas agendamento_servicos.servico_id e
-- atendimentos.servico_id/cliente_id referenciam servicos/clientes SEM
-- cascade — dependendo da ordem interna dos triggers de FK, isso quebra com
-- "violates foreign key constraint". Por isso apagamos manualmente, na
-- ordem certa, antes de deixar o cascade cuidar do resto (usuarios,
-- categorias_servico, configuracao_negocio, horarios_atendimento,
-- bloqueios_agenda, logs, push_subscriptions).
--
-- ATENÇÃO: Este script apaga TODOS os dados dos 5 estabelecimentos demo.
-- Use apenas em ambiente de demo/testes. NÃO rode em produção.
-- =========================================================================

DO $$
DECLARE
  est_ids UUID[];
BEGIN
  SELECT array_agg(id) INTO est_ids
  FROM public.estabelecimentos
  WHERE slug IN (
    'studio-m-lash',
    'be-lash-studio',
    'gabi-costa-cilios',
    'fernanda-lash-premium',
    'camila-rodrigues-lash'
  );

  IF est_ids IS NULL THEN
    RAISE NOTICE 'Nenhum estabelecimento demo encontrado — nada para limpar.';
    RETURN;
  END IF;

  -- 1. agendamento_servicos depende de agendamentos (sem cascade do lado servico_id)
  DELETE FROM public.agendamento_servicos
  WHERE agendamento_id IN (
    SELECT id FROM public.agendamentos WHERE estabelecimento_id = ANY(est_ids)
  );

  -- 2. atendimentos referencia servico_id e cliente_id sem cascade
  DELETE FROM public.atendimentos WHERE estabelecimento_id = ANY(est_ids);

  -- 3. agendamentos referencia cliente_id sem cascade
  DELETE FROM public.agendamentos WHERE estabelecimento_id = ANY(est_ids);

  -- 4. servicos (variacoes_servico cai junto via cascade em servico_id)
  DELETE FROM public.servicos WHERE estabelecimento_id = ANY(est_ids);

  -- 5. clientes
  DELETE FROM public.clientes WHERE estabelecimento_id = ANY(est_ids);

  -- 6. o resto (usuarios, categorias_servico, configuracao_negocio,
  --    horarios_atendimento, bloqueios_agenda, logs, push_subscriptions)
  --    cai certinho via ON DELETE CASCADE ao apagar o estabelecimento.
  DELETE FROM public.estabelecimentos WHERE id = ANY(est_ids);
END;
$$;

-- O CASCADE acima apaga public.usuarios, mas NÃO as contas de autenticação
-- (auth.users) criadas por scripts/create_demo_auth_users.mjs. Descomente
-- para apagá-las também (login deixará de funcionar até recriá-las):
-- DELETE FROM auth.users
-- WHERE email IN (
--   'mariana@studiomlash.com.br',
--   'beatriz@belashstudio.com.br',
--   'gabriela@gabicostacilos.com.br',
--   'fernanda@fernandalash.com.br',
--   'camila@camilalash.com.br'
-- );
