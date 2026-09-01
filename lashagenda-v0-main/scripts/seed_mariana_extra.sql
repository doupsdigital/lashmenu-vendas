-- =========================================================================
-- LASH AGENDA — DADOS EXTRA PARA MARIANA LIMA (Studio M Lash)
-- 5 agendamentos hoje + 5 amanhã, espaçados durante o expediente (09–18h)
-- com folgas de 30/45/60 min entre atendimentos.
--
-- v2: corrige bug de timezone da v1 — os horários eram gravados como
-- "09:00 UTC" em vez de "09:00 América/São Paulo" (a sessão do SQL Editor
-- roda em UTC, então um timestamp "nu" sem timezone era ancorado errado,
-- aparecendo 3h adiantado/atrasado no app). Agora usamos
-- `AT TIME ZONE 'America/Sao_Paulo'` para ancorar corretamente.
--
-- Os 10 clientes já foram criados pela v1 deste script — esta versão
-- reaproveita os mesmos (busca por e-mail) e SUBSTITUI só os agendamentos
-- antigos (com timezone errado) pelos novos, corretos e espaçados.
--
-- Execute no SQL Editor do Supabase, depois do seed_demo.sql já ter rodado.
-- =========================================================================

DO $$
DECLARE
  v_est UUID;

  -- Serviços existentes (buscados por nome)
  v_fio UUID; v_rem UUID; v_hen UUID; v_spa UUID; v_sob UUID; v_lft UUID; v_man UUID;

  -- 10 clientes já criados pela v1 (busca por e-mail, não recria)
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID;
  c6 UUID; c7 UUID; c8 UUID; c9 UUID; c10 UUID;

  ag UUID;
BEGIN
  SELECT id INTO v_est FROM public.estabelecimentos WHERE slug = 'studio-m-lash';
  IF v_est IS NULL THEN
    RAISE EXCEPTION 'Estabelecimento studio-m-lash não encontrado. Rode o seed_demo.sql antes.';
  END IF;

  SELECT id INTO v_fio FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Fio a Fio Clássico';
  SELECT id INTO v_rem FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Remoção de Extensão';
  SELECT id INTO v_hen FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Design com Henna';
  SELECT id INTO v_spa FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Spa de Cílios';
  SELECT id INTO v_sob FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Design de Sobrancelhas';
  SELECT id INTO v_lft FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Lash Lifting Completo';
  SELECT id INTO v_man FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Manutenção de Extensão';

  SELECT id INTO c1  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'beatriz.nogueira@gmail.com';
  SELECT id INTO c2  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'camila.rezende@hotmail.com';
  SELECT id INTO c3  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'daniela.prado@gmail.com';
  SELECT id INTO c4  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'eduarda.martins@outlook.com';
  SELECT id INTO c5  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'fabiana.cardoso@gmail.com';
  SELECT id INTO c6  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'giovanna.tavares@icloud.com';
  SELECT id INTO c7  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'helena.brandao@gmail.com';
  SELECT id INTO c8  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'ingrid.pereira@yahoo.com.br';
  SELECT id INTO c9  FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'jaqueline.souza@gmail.com';
  SELECT id INTO c10 FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'karina.lacerda@gmail.com';

  IF c1 IS NULL OR c2 IS NULL OR c3 IS NULL OR c4 IS NULL OR c5 IS NULL
     OR c6 IS NULL OR c7 IS NULL OR c8 IS NULL OR c9 IS NULL OR c10 IS NULL THEN
    RAISE EXCEPTION 'Clientes da v1 não encontrados. Rode a v1 de seed_mariana_extra.sql antes (ou recrie os clientes).';
  END IF;

  -- Apaga os agendamentos antigos (com timezone errado) desses 10 clientes
  DELETE FROM public.agendamento_servicos
  WHERE agendamento_id IN (
    SELECT id FROM public.agendamentos
    WHERE cliente_id IN (c1,c2,c3,c4,c5,c6,c7,c8,c9,c10)
  );
  DELETE FROM public.agendamentos
  WHERE cliente_id IN (c1,c2,c3,c4,c5,c6,c7,c8,c9,c10);

  -- ======================================================================
  -- 5 AGENDAMENTOS HOJE — espaçados, com folgas de 30/60/30/45 min
  -- ======================================================================
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c1, (CURRENT_DATE::timestamp + TIME '09:00') AT TIME ZONE 'America/Sao_Paulo', 90,'confirmado','admin',100.00,'Manutenção de extensão');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_man,100.00);
  -- folga 30 min (10:30–11:00)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c2, (CURRENT_DATE::timestamp + TIME '11:00') AT TIME ZONE 'America/Sao_Paulo', 60,'confirmado','admin',120.00,'Lash Lifting completo');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_lft,120.00);
  -- folga de almoço 60 min (12:00–13:00)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c3, (CURRENT_DATE::timestamp + TIME '13:00') AT TIME ZONE 'America/Sao_Paulo', 45,'confirmado','admin', 50.00,'Design de sobrancelhas');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_sob,50.00);
  -- folga 30 min (13:45–14:15)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c4, (CURRENT_DATE::timestamp + TIME '14:15') AT TIME ZONE 'America/Sao_Paulo', 60,'pendente','admin', 70.00,'Design com henna');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_hen,70.00);
  -- folga 45 min (15:15–16:00)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c5, (CURRENT_DATE::timestamp + TIME '16:00') AT TIME ZONE 'America/Sao_Paulo', 30,'confirmado','admin', 50.00,'Spa de cílios');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_spa,50.00);
  -- encerra 16:30, dentro do expediente (09–18h)

  -- ======================================================================
  -- 5 AGENDAMENTOS AMANHÃ — espaçados, com folgas de 45/60/30/30 min
  -- ======================================================================
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c6, ((CURRENT_DATE + 1)::timestamp + TIME '09:00') AT TIME ZONE 'America/Sao_Paulo', 120,'confirmado','admin',150.00,'Fio a Fio Clássico');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_fio,150.00);
  -- folga 45 min (11:00–11:45)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c7, ((CURRENT_DATE + 1)::timestamp + TIME '11:45') AT TIME ZONE 'America/Sao_Paulo', 90,'confirmado','admin',100.00,'Manutenção de extensão');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_man,100.00);
  -- folga de almoço 60 min (13:15–14:15)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c8, ((CURRENT_DATE + 1)::timestamp + TIME '14:15') AT TIME ZONE 'America/Sao_Paulo', 45,'pendente','admin', 40.00,'Remoção de extensão');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_rem,40.00);
  -- folga 30 min (15:00–15:30)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c9, ((CURRENT_DATE + 1)::timestamp + TIME '15:30') AT TIME ZONE 'America/Sao_Paulo', 60,'confirmado','admin', 70.00,'Design com henna');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_hen,70.00);
  -- folga 30 min (16:30–17:00)

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,v_est,c10,((CURRENT_DATE + 1)::timestamp + TIME '17:00') AT TIME ZONE 'America/Sao_Paulo', 30,'confirmado','admin', 50.00,'Spa de cílios');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,v_spa,50.00);
  -- encerra 17:30, dentro do expediente (09–18h)

END;
$$;
