-- =========================================================================
-- LASH AGENDA — SEED "MARIANA ROSA" (conta de vídeo/demo, plano Premium)
--
-- Popula uma profissional única, no plano Premium, com dados realistas em
-- TODOS os recursos do sistema — os do plano Básico (agendamento, clientes,
-- serviços, horários, bloqueios, atendimentos manuais) e os exclusivos do
-- Premium (fichas de anamnese completas por cliente, e um histórico rico
-- de ~4 meses de atendimentos/agendamentos concluídos, pra Relatórios ter
-- dado suficiente pra mostrar evolução de faturamento, serviços mais
-- realizados, clientes novas x fiéis, etc.) — pronta pra gravar vídeos de
-- exemplo do sistema em uso.
--
-- Pré-requisito: rode antes "node scripts/create_auth_user_mariana_rosa.mjs"
-- (cria a conta de autenticação — public.usuarios.id precisa ser o mesmo
-- ID da conta de auth correspondente, é assim que o login resolve o
-- profissional certo). Execute este SQL no SQL Editor do Supabase.
--
-- Não usa categorias_servico nem variacoes_servico de propósito — nenhuma
-- das duas tem mais gestão pela UI (reestruturação de 14/07), então não
-- faz sentido popular dado que a própria Mariana não teria como criar,
-- independente do plano.
-- =========================================================================

DO $$
DECLARE
  est UUID;
  usr UUID;
  old_est UUID;

  -- Serviços
  s_fio UUID; s_vr UUID; s_vh UUID; s_vb UUID; s_mega UUID;
  s_lft UUID; s_spa UUID; s_sob UUID; s_brow UUID; s_man UUID;

  -- Clientes
  cl_01 UUID; cl_02 UUID; cl_03 UUID; cl_04 UUID; cl_05 UUID; cl_06 UUID; cl_07 UUID; cl_08 UUID;
  cl_09 UUID; cl_10 UUID; cl_11 UUID; cl_12 UUID; cl_13 UUID; cl_14 UUID; cl_15 UUID; cl_16 UUID;

  -- Reutilizado a cada INSERT de agendamento
  ag UUID;
BEGIN

  -- ======================================================================
  -- 1. USUÁRIO (busca o ID criado por create_auth_user_mariana_rosa.mjs)
  -- ======================================================================
  SELECT id INTO usr FROM auth.users WHERE email = 'mariana.rosa@gmail.com';

  IF usr IS NULL THEN
    RAISE EXCEPTION 'Conta de autenticação da Mariana Rosa não encontrada. Rode "node scripts/create_auth_user_mariana_rosa.mjs" antes deste seed.';
  END IF;

  -- Se já existe uma profissional com esse e-mail (de uma tentativa anterior
  -- deste script), limpa os dados dela antes de recriar. agendamento_id em
  -- agendamento_servicos tem ON DELETE CASCADE, mas servico_id (nessa
  -- tabela e em atendimentos) não tem — apagar o estabelecimento direto
  -- derruba servicos e agendamentos em cascatas paralelas cuja ordem o
  -- Postgres não garante, e pode tentar apagar um serviço enquanto ainda
  -- há uma linha em agendamento_servicos/atendimentos apontando pra ele.
  -- Por isso apaga essas duas tabelas explicitamente primeiro.
  SELECT estabelecimento_id INTO old_est FROM public.usuarios WHERE id = usr;

  IF old_est IS NOT NULL THEN
    DELETE FROM public.agendamento_servicos
    WHERE agendamento_id IN (SELECT id FROM public.agendamentos WHERE estabelecimento_id = old_est);

    DELETE FROM public.atendimentos WHERE estabelecimento_id = old_est;

    DELETE FROM public.estabelecimentos WHERE id = old_est;
  END IF;

  -- ======================================================================
  -- 2. ESTABELECIMENTO — plano Premium, assinatura ativa (sem trial)
  -- ======================================================================
  est := gen_random_uuid();

  INSERT INTO public.estabelecimentos (id, nome_negocio, slug, plano, status_assinatura, trial_ends_at, created_at) VALUES
    (est, 'Mariana Rosa Lash Studio', 'mariana-rosa-lash', 'premium', 'ativo', NULL, NOW() - INTERVAL '7 months');

  INSERT INTO public.usuarios (id, estabelecimento_id, nome, email, role, telefone, created_at) VALUES
    (usr, est, 'Mariana Rosa', 'mariana.rosa@gmail.com', 'profissional', '(21) 98234-1122', NOW() - INTERVAL '7 months');

  -- ======================================================================
  -- 3. CONFIGURAÇÃO DO NEGÓCIO
  -- ======================================================================
  INSERT INTO public.configuracao_negocio
    (estabelecimento_id, nome_negocio, descricao, instagram, endereco, aprovacao_automatica, antecedencia_cancelamento_horas, mensagem_pos_agendamento, paleta_cores, modo_escuro) VALUES
    (est, 'Mariana Rosa Lash Studio',
      'Lash designer premium, especialista em Volume Russo e Mega Volume. Atendimento particular em Copacabana, com hora marcada.',
      '@marianarosalash',
      'Av. Nossa Senhora de Copacabana, 540, sala 12 — Rio de Janeiro, RJ',
      true, 24,
      'Seu agendamento foi confirmado automaticamente! Te espero no horário combinado 💕',
      'rosa_blush', false);

  -- ======================================================================
  -- 4. HORÁRIOS DE ATENDIMENTO — Seg–Sex 09–19, Sáb 09–15
  -- ======================================================================
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est,1,'09:00','19:00'),(est,2,'09:00','19:00'),(est,3,'09:00','19:00'),
    (est,4,'09:00','19:00'),(est,5,'09:00','19:00'),(est,6,'09:00','15:00');

  -- ======================================================================
  -- 5. BLOQUEIOS DE AGENDA
  -- ======================================================================
  INSERT INTO public.bloqueios_agenda (estabelecimento_id,data_inicio,data_fim,motivo,dia_inteiro) VALUES
    (est, CURRENT_DATE + 15, CURRENT_DATE + 17, 'Curso avançado — Mega Volume e Efeito Fox Eye', true);
  INSERT INTO public.bloqueios_agenda (estabelecimento_id,data_inicio,data_fim,motivo,dia_inteiro,hora_inicio,hora_fim) VALUES
    (est, CURRENT_DATE + 6, CURRENT_DATE + 6, 'Consulta médica', false, '13:00', '15:00');

  -- ======================================================================
  -- 6. SERVIÇOS (sem categoria — recurso descontinuado; sem variações —
  --    idem, sem gestão pela UI desde a reestruturação de Serviços)
  -- ======================================================================
  s_fio:=gen_random_uuid(); s_vr:=gen_random_uuid(); s_vh:=gen_random_uuid(); s_vb:=gen_random_uuid(); s_mega:=gen_random_uuid();
  s_lft:=gen_random_uuid(); s_spa:=gen_random_uuid(); s_sob:=gen_random_uuid(); s_brow:=gen_random_uuid(); s_man:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,nome,descricao,duracao_minutos,valor,ativo) VALUES
    (s_fio, est,'Fio a Fio Clássico','Um fio sintético aplicado a cada cílio natural. Efeito natural e alongado.',120,160.00,true),
    (s_vr,  est,'Volume Russo','Fans artesanais de 3 a 6 fios por cílio. Efeito volumoso e marcante.',150,220.00,true),
    (s_vh,  est,'Volume Híbrido','Mistura de fio a fio com volume russo. Equilíbrio entre natural e volumoso.',135,195.00,true),
    (s_vb,  est,'Volume Brasileiro','Fans mais leves que o russo, efeito volumoso e confortável.',120,175.00,true),
    (s_mega,est,'Mega Volume','Fans ultra finos e densos. Efeito extremamente volumoso e dramático.',165,260.00,true),
    (s_lft, est,'Lash Lifting + Botox de Cílios','Curva e nutre os cílios naturais, sem aplicação de fios.',60,130.00,true),
    (s_spa, est,'Spa de Cílios','Limpeza profunda e hidratação dos cílios e da pele ao redor dos olhos.',30,60.00,true),
    (s_sob, est,'Design de Sobrancelhas','Design com pinça e linha, alinhado ao formato do rosto.',45,55.00,true),
    (s_brow,est,'Brow Lamination','Alinhamento e fixação dos fios da sobrancelha, efeito preenchido.',60,150.00,true),
    (s_man, est,'Manutenção de Extensão','Reposição dos fios que caíram naturalmente. Recomendado a cada 2–3 semanas.',90,110.00,true);

  -- ======================================================================
  -- 7. CLIENTES — com ficha de anamnese completa (recurso Premium)
  -- ======================================================================
  cl_01:=gen_random_uuid(); cl_02:=gen_random_uuid(); cl_03:=gen_random_uuid(); cl_04:=gen_random_uuid();
  cl_05:=gen_random_uuid(); cl_06:=gen_random_uuid(); cl_07:=gen_random_uuid(); cl_08:=gen_random_uuid();
  cl_09:=gen_random_uuid(); cl_10:=gen_random_uuid(); cl_11:=gen_random_uuid(); cl_12:=gen_random_uuid();
  cl_13:=gen_random_uuid(); cl_14:=gen_random_uuid(); cl_15:=gen_random_uuid(); cl_16:=gen_random_uuid();

  INSERT INTO public.clientes
    (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,alergias,medicamentos,doencas_cronicas,gestante,anamnese_lash,created_at) VALUES
    (cl_01,est,'Beatriz','Nogueira','beatriz.nogueira@gmail.com','(21) 99711-2201','1994-02-18',
      'Cliente desde a abertura do estúdio. Sempre pontual.', NULL, NULL, NULL, false,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      NOW() - INTERVAL '7 months'),
    (cl_02,est,'Camila','Duarte','camila.duarte@hotmail.com','(21) 98622-3302','1991-06-05',
      'Prefere Mega Volume. Cuidadosa com o pós-procedimento.', NULL, NULL, NULL, false,
      '{"curvatura":"L","espessura":"0.05","mapping":"Mega Volume","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Dramático"}'::jsonb,
      NOW() - INTERVAL '6 months'),
    (cl_03,est,'Débora','Azevedo','debora.azevedo@gmail.com','(21) 97533-4403','1997-10-22',
      'Pele sensível ao redor dos olhos — usar cola hipoalergênica.',
      'Sensibilidade à cola comum de cianoacrilato padrão.', NULL, NULL, false,
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":true,"estilo":"Delicado"}'::jsonb,
      NOW() - INTERVAL '6 months'),
    (cl_04,est,'Elaine','Ramos','elaine.ramos@outlook.com','(21) 96444-5504','1988-01-14',
      'Executiva, cílios discretos pro trabalho.', NULL, NULL, NULL, false,
      '{"curvatura":"B","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Discreto"}'::jsonb,
      NOW() - INTERVAL '5 months'),
    (cl_05,est,'Fernanda','Vieira','fernanda.vieira@gmail.com','(21) 95355-6605','2000-04-09',
      'Influenciadora digital — precisa de cílios perfeitos pra foto.', NULL, NULL, NULL, false,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      NOW() - INTERVAL '5 months'),
    (cl_06,est,'Gabriela','Nunes','gabriela.nunes@icloud.com','(21) 94266-7706','1993-08-27',
      'Faz academia todos os dias. Orientada sobre cuidados pós extensão.', NULL, NULL, NULL, false,
      '{"curvatura":"CC","espessura":"0.07","mapping":"Volume Brasileiro","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Volumoso"}'::jsonb,
      NOW() - INTERVAL '5 months'),
    (cl_07,est,'Heloísa','Campos','heloisa.campos@gmail.com','(21) 93177-8807','1996-12-01',
      'Primeira extensão em fevereiro — adorou o resultado.', NULL, NULL, NULL, false,
      '{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '4 months'),
    (cl_08,est,'Isabela','Freitas','isabela.freitas@yahoo.com.br','(21) 92088-9908','1985-05-16',
      'Médica, horários variados por causa dos plantões.',
      NULL, 'Uso contínuo de anti-histamínico (rinite).', NULL, false,
      '{"curvatura":"C","espessura":"0.07","mapping":"Fox Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Sofisticado"}'::jsonb,
      NOW() - INTERVAL '4 months'),
    (cl_09,est,'Juliana','Barros','juliana.barros@gmail.com','(21) 91999-0009','1999-03-30',
      'Modelo — precisa de cílios impecáveis pra ensaios.', NULL, NULL, NULL, false,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Dramático"}'::jsonb,
      NOW() - INTERVAL '4 months'),
    (cl_10,est,'Karen','Medeiros','karen.medeiros@hotmail.com','(21) 90800-1110','1990-09-11',
      'Cliente VIP. Sempre agenda com 3 semanas de antecedência.', NULL, NULL, NULL, false,
      '{"curvatura":"L","espessura":"0.07","mapping":"Mega Volume","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Volumoso"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl_11,est,'Letícia','Andrade','leticia.andrade@gmail.com','(21) 99701-2211','2001-07-08',
      'Estudante de Direito, horários no fim da tarde.', NULL, NULL, NULL, false,
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl_12,est,'Mônica','Teixeira','monica.teixeira@gmail.com','(21) 98612-3312','1983-11-24',
      'Empresária, viaja bastante — agenda por WhatsApp.', NULL, NULL, 'Hipotireoidismo controlado.', false,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Sofisticado"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl_13,est,'Natália','Correia','natalia.correia@outlook.com','(21) 97523-4413','1995-02-19',
      'Bancária, cílios discretos pro ambiente corporativo.', NULL, NULL, NULL, false,
      '{"curvatura":"B","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Discreto"}'::jsonb,
      NOW() - INTERVAL '2 months'),
    (cl_14,est,'Otávia','Lacerda','otavia.lacerda@gmail.com','(21) 96434-5514','1998-06-13',
      'Adora testar volumes diferentes a cada visita.', NULL, NULL, NULL, false,
      '{"curvatura":"CC","espessura":"0.07","mapping":"Volume Híbrido","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Volumoso"}'::jsonb,
      NOW() - INTERVAL '2 months'),
    (cl_15,est,'Patrícia','Guedes','patricia.guedes@gmail.com','(21) 95345-6615','1987-10-02',
      'Dentista, agenda no intervalo do almoço.', NULL, NULL, NULL, false,
      '{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '6 weeks'),
    (cl_16,est,'Rebeca','Monteiro','rebeca.monteiro@gmail.com','(21) 94256-7716','1994-12-05',
      'Gestante — 4 meses. Ciente das recomendações médicas, sem restrição pra extensão nessa fase.', NULL, NULL, NULL, true,
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '3 weeks');

  -- ======================================================================
  -- 8. AGENDAMENTOS — hoje, próximos dias e ~4 meses de histórico (todos
  --    os status), pra Relatórios ter dado suficiente pra mostrar tendência
  -- ======================================================================

  -- Hoje
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_01, CURRENT_DATE::timestamp + TIME '09:30',150,'confirmado','portal',220.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,220.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_05, CURRENT_DATE::timestamp + TIME '14:00',120,'confirmado','admin',175.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vb,175.00);

  -- Amanhã
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_02, (CURRENT_DATE + 1)::timestamp + TIME '10:00',165,'confirmado','portal',260.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_mega,260.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_09, (CURRENT_DATE + 1)::timestamp + TIME '13:00',150,'pendente','portal',220.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,220.00);

  -- Próximos dias
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_10, (CURRENT_DATE + 2)::timestamp + TIME '09:00',165,'pendente','portal',260.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_mega,260.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_16, (CURRENT_DATE + 3)::timestamp + TIME '11:00', 90,'confirmado','portal',110.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_man,110.00);

  -- Concluídos — histórico espalhado por ~4 meses
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_03, (CURRENT_DATE - 5)::timestamp + TIME '10:00',120,'concluido','portal',160.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_fio,160.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_04, (CURRENT_DATE - 12)::timestamp + TIME '11:00', 45,'concluido','admin',55.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_sob,55.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_06, (CURRENT_DATE - 18)::timestamp + TIME '09:00', 90,'concluido','portal',110.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_man,110.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_07, (CURRENT_DATE - 25)::timestamp + TIME '14:00',135,'concluido','portal',195.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vh,195.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_08, (CURRENT_DATE - 35)::timestamp + TIME '10:00',150,'concluido','portal',220.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,220.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_01, (CURRENT_DATE - 42)::timestamp + TIME '09:00', 30,'concluido','admin', 60.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_spa,60.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_11, (CURRENT_DATE - 50)::timestamp + TIME '16:00', 60,'concluido','portal',130.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_lft,130.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_12, (CURRENT_DATE - 60)::timestamp + TIME '11:00',165,'concluido','portal',260.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_mega,260.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_02, (CURRENT_DATE - 72)::timestamp + TIME '10:00', 60,'concluido','portal',150.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_brow,150.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_13, (CURRENT_DATE - 85)::timestamp + TIME '09:00',120,'concluido','portal',175.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vb,175.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_14, (CURRENT_DATE - 98)::timestamp + TIME '14:00',135,'concluido','portal',195.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vh,195.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_15, (CURRENT_DATE - 110)::timestamp + TIME '12:00',120,'concluido','portal',160.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_fio,160.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_09, (CURRENT_DATE - 120)::timestamp + TIME '10:00',150,'concluido','portal',220.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,220.00);

  -- Faltas e cancelados
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_06, (CURRENT_DATE - 8)::timestamp + TIME '15:00',120,'falta','portal',175.00,'Não compareceu e não avisou');

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_10, (CURRENT_DATE - 30)::timestamp + TIME '11:00',165,'falta','portal',260.00,'Segunda falta consecutiva — avisada sobre política de tolerância');

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_04, (CURRENT_DATE - 15)::timestamp + TIME '09:00', 90,'cancelado','portal', 110.00,'Cancelou com antecedência — reagendou pro mês seguinte');

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_13, (CURRENT_DATE - 45)::timestamp + TIME '14:00',135,'cancelado','portal', 195.00,'Imprevisto de trabalho');

  -- ======================================================================
  -- 9. ATENDIMENTOS MANUAIS (histórico financeiro registrado direto, sem
  --    passar pelo fluxo de agendamento — reforça o faturamento histórico
  --    pra Relatórios)
  -- ======================================================================
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est,cl_05,s_mega, CURRENT_DATE - 9,  260.00,'Mega Volume — cliente amou o resultado'),
    (est,cl_08,s_vh,   CURRENT_DATE - 22, 195.00,'Vol. Híbrido — resultado natural'),
    (est,cl_03,s_man,  CURRENT_DATE - 28,  110.00,'Manutenção quinzenal'),
    (est,cl_14,s_fio,  CURRENT_DATE - 40, 160.00,'Fio a fio clássico'),
    (est,cl_07,s_brow, CURRENT_DATE - 55,  150.00,'Brow lamination — primeira vez'),
    (est,cl_11,s_lft,  CURRENT_DATE - 68, 130.00,'Lash lifting — sem aplicação de fios'),
    (est,cl_15,s_spa,  CURRENT_DATE - 82,  60.00,'Spa de cílios — pausa entre extensões'),
    (est,cl_12,s_vr,   CURRENT_DATE - 100,220.00,'Volume Russo completo'),
    (est,cl_09,s_vb,   CURRENT_DATE - 118,175.00,'Volume Brasileiro — retorno mensal');

END $$;
