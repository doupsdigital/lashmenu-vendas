-- =========================================================================
-- LASH AGENDA — SEED "AMANDA ALVES" (conta de vídeo/demo, plano Agenda/Básico)
--
-- Popula uma profissional única, no plano Básico, com dados realistas em
-- todas as funcionalidades disponíveis nesse plano: serviços, clientes,
-- horários, bloqueio de agenda, agendamentos (com todos os status) e
-- atendimentos manuais — pronta pra gravar vídeos de exemplo do sistema
-- em uso.
--
-- Pré-requisito: rode antes "node scripts/create_auth_user_amanda.mjs"
-- (cria a conta de autenticação — public.usuarios.id precisa ser o mesmo
-- ID da conta de auth correspondente, é assim que o login resolve o
-- profissional certo). Execute este SQL no SQL Editor do Supabase.
--
-- Não usa categorias_servico nem variacoes_servico de propósito — nenhuma
-- das duas tem mais gestão pela UI (reestruturação de 14/07), então não
-- faz sentido popular dado que a própria Amanda não teria como criar.
-- Também não popula alergias/medicamentos/doencas_cronicas/anamnese_lash
-- em clientes — são exclusivos da Ficha de Anamnese, recurso Premium que
-- o plano Básico não acessa.
-- =========================================================================

DO $$
DECLARE
  est UUID;
  usr UUID;
  old_est UUID;

  -- Serviços
  s_fio UUID; s_vr UUID; s_vh UUID; s_vb UUID;
  s_lft UUID; s_sob UUID; s_man UUID; s_rem UUID;

  -- Clientes
  cl_01 UUID; cl_02 UUID; cl_03 UUID; cl_04 UUID; cl_05 UUID; cl_06 UUID;
  cl_07 UUID; cl_08 UUID; cl_09 UUID; cl_10 UUID; cl_11 UUID; cl_12 UUID;

  -- Reutilizado a cada INSERT de agendamento
  ag UUID;
BEGIN

  -- ======================================================================
  -- 1. USUÁRIO (busca o ID criado por create_auth_user_amanda.mjs)
  -- ======================================================================
  SELECT id INTO usr FROM auth.users WHERE email = 'amanda.alves@gmail.com';

  IF usr IS NULL THEN
    RAISE EXCEPTION 'Conta de autenticação da Amanda não encontrada. Rode "node scripts/create_auth_user_amanda.mjs" antes deste seed.';
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
  -- 2. ESTABELECIMENTO — plano Básico, assinatura ativa (sem trial, pra não
  --    aparecer banner de contagem regressiva nos vídeos)
  -- ======================================================================
  est := gen_random_uuid();

  INSERT INTO public.estabelecimentos (id, nome_negocio, slug, plano, status_assinatura, trial_ends_at, created_at) VALUES
    (est, 'Amanda Alves Lash Designer', 'amanda-alves-lash', 'basico', 'ativo', NULL, NOW() - INTERVAL '5 months');

  INSERT INTO public.usuarios (id, estabelecimento_id, nome, email, role, telefone, created_at) VALUES
    (usr, est, 'Amanda Alves', 'amanda.alves@gmail.com', 'profissional', '(11) 98123-4567', NOW() - INTERVAL '5 months');

  -- ======================================================================
  -- 3. CONFIGURAÇÃO DO NEGÓCIO
  -- ======================================================================
  INSERT INTO public.configuracao_negocio
    (estabelecimento_id, nome_negocio, descricao, instagram, endereco, aprovacao_automatica, antecedencia_cancelamento_horas, mensagem_pos_agendamento, paleta_cores, modo_escuro) VALUES
    (est, 'Amanda Alves Lash Designer',
      'Lash designer certificada, especialista em extensão de cílios fio a fio e volume russo. Atendimento particular em São Paulo, com hora marcada.',
      '@amandaalveslash',
      'Rua Girassol, 210, Vila Madalena — São Paulo, SP',
      false, 24,
      'Seu agendamento foi recebido! Vou confirmar em breve pelo WhatsApp. Qualquer dúvida, só chamar 💕',
      'pink_classico', false);

  -- ======================================================================
  -- 4. HORÁRIOS DE ATENDIMENTO — Seg–Sex 09–18, Sáb 09–13
  -- ======================================================================
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est,1,'09:00','18:00'),(est,2,'09:00','18:00'),(est,3,'09:00','18:00'),
    (est,4,'09:00','18:00'),(est,5,'09:00','18:00'),(est,6,'09:00','13:00');

  -- ======================================================================
  -- 5. BLOQUEIO DE AGENDA
  -- ======================================================================
  INSERT INTO public.bloqueios_agenda (estabelecimento_id,data_inicio,data_fim,motivo,dia_inteiro) VALUES
    (est, CURRENT_DATE + 10, CURRENT_DATE + 11, 'Curso de atualização — Volume Russo Avançado', true);
  INSERT INTO public.bloqueios_agenda (estabelecimento_id,data_inicio,data_fim,motivo,dia_inteiro,hora_inicio,hora_fim) VALUES
    (est, CURRENT_DATE + 4, CURRENT_DATE + 4, 'Horário de almoço estendido', false, '12:00', '14:00');

  -- ======================================================================
  -- 6. SERVIÇOS (sem categoria — recurso descontinuado; sem variações —
  --    idem, sem gestão pela UI desde a reestruturação de Serviços)
  -- ======================================================================
  s_fio:=gen_random_uuid(); s_vr:=gen_random_uuid(); s_vh:=gen_random_uuid(); s_vb:=gen_random_uuid();
  s_lft:=gen_random_uuid(); s_sob:=gen_random_uuid(); s_man:=gen_random_uuid(); s_rem:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,nome,descricao,duracao_minutos,valor,ativo) VALUES
    (s_fio,est,'Fio a Fio Clássico','Um fio sintético aplicado a cada cílio natural. Efeito natural e alongado.',120,140.00,true),
    (s_vr, est,'Volume Russo','Fans artesanais de 3 a 6 fios por cílio. Efeito volumoso e marcante.',150,190.00,true),
    (s_vh, est,'Volume Híbrido','Mistura de fio a fio com volume russo. Equilíbrio entre natural e volumoso.',135,165.00,true),
    (s_vb, est,'Volume Brasileiro','Fans mais leves que o russo, efeito volumoso e confortável.',120,150.00,true),
    (s_lft,est,'Lash Lifting + Botox de Cílios','Curva e nutre os cílios naturais, sem aplicação de fios.',60,110.00,true),
    (s_sob,est,'Design de Sobrancelhas','Design com pinça e linha, alinhado ao formato do rosto.',45,45.00,true),
    (s_man,est,'Manutenção de Extensão','Reposição dos fios que caíram naturalmente. Recomendado a cada 2–3 semanas.',90,90.00,true),
    (s_rem,est,'Remoção de Extensão','Remoção segura dos fios com produto próprio, sem danificar o cílio natural.',30,35.00,true);

  -- ======================================================================
  -- 7. CLIENTES
  -- ======================================================================
  cl_01:=gen_random_uuid(); cl_02:=gen_random_uuid(); cl_03:=gen_random_uuid(); cl_04:=gen_random_uuid();
  cl_05:=gen_random_uuid(); cl_06:=gen_random_uuid(); cl_07:=gen_random_uuid(); cl_08:=gen_random_uuid();
  cl_09:=gen_random_uuid(); cl_10:=gen_random_uuid(); cl_11:=gen_random_uuid(); cl_12:=gen_random_uuid();

  INSERT INTO public.clientes (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,created_at) VALUES
    (cl_01,est,'Bruna','Cardoso','bruna.cardoso@gmail.com','(11) 99811-2233','1996-03-11','Cliente fiel, sempre agenda Volume Russo.', NOW() - INTERVAL '5 months'),
    (cl_02,est,'Camila','Ribeiro','camila.ribeiro@hotmail.com','(11) 98722-3344','1993-08-24','Prefere horários pela manhã.', NOW() - INTERVAL '4 months'),
    (cl_03,est,'Daniela','Souza','daniela.souza@gmail.com','(11) 97633-4455','1998-01-17','Pele sensível — usar cola hipoalergênica.', NOW() - INTERVAL '4 months'),
    (cl_04,est,'Eduarda','Martins','eduarda.martins@outlook.com','(11) 96544-5566','1991-11-02','Indicação da Bruna Cardoso.', NOW() - INTERVAL '3 months'),
    (cl_05,est,'Fabiana','Rocha','fabiana.rocha@gmail.com','(11) 95455-6677','1989-05-29','Gosta de cílios bem naturais para o trabalho.', NOW() - INTERVAL '3 months'),
    (cl_06,est,'Giovanna','Almeida','giovanna.almeida@icloud.com','(11) 94366-7788','2000-09-14','Primeira vez em julho — adorou o resultado.', NOW() - INTERVAL '2 months'),
    (cl_07,est,'Helena','Duarte','helena.duarte@gmail.com','(11) 93277-8899','1995-06-08','Retorno mensal certinho.', NOW() - INTERVAL '2 months'),
    (cl_08,est,'Ingrid','Farias','ingrid.farias@yahoo.com.br','(11) 92188-9900','1987-12-20','Trabalha como recepcionista, horários flexíveis.', NOW() - INTERVAL '6 weeks'),
    (cl_09,est,'Jaqueline','Moura','jaqueline.moura@gmail.com','(11) 91099-0011','1994-02-27','Veio pelo Instagram.', NOW() - INTERVAL '5 weeks'),
    (cl_10,est,'Karina','Batista','karina.batista@hotmail.com','(11) 90910-1122','1999-10-05','Gosta de testar volumes diferentes a cada visita.', NOW() - INTERVAL '4 weeks'),
    (cl_11,est,'Larissa','Cunha','larissa.cunha@gmail.com','(11) 99021-2233','1992-07-19','Estudante, prefere horários no fim da tarde.', NOW() - INTERVAL '3 weeks'),
    (cl_12,est,'Manuela','Prado','manuela.prado@gmail.com','(11) 98932-3344','1990-04-13','Cliente nova, ainda conhecendo o trabalho.', NOW() - INTERVAL '2 weeks');

  -- ======================================================================
  -- 8. AGENDAMENTOS — hoje, próximos dias e histórico (todos os status)
  -- ======================================================================

  -- Hoje
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_01, CURRENT_DATE::timestamp + TIME '09:30',150,'confirmado','portal',190.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,190.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_05, CURRENT_DATE::timestamp + TIME '14:00',120,'confirmado','admin',140.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_fio,140.00);

  -- Amanhã
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_02, (CURRENT_DATE + 1)::timestamp + TIME '09:00', 90,'confirmado','portal',90.00,'Manutenção — 2 semanas');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_man,90.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_09, (CURRENT_DATE + 1)::timestamp + TIME '11:00',135,'pendente','portal',165.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vh,165.00);

  -- Próximos dias
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_06, (CURRENT_DATE + 2)::timestamp + TIME '10:00',150,'pendente','portal',190.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,190.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_11, (CURRENT_DATE + 3)::timestamp + TIME '16:00', 60,'confirmado','portal',110.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_lft,110.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_12, (CURRENT_DATE + 5)::timestamp + TIME '09:00',120,'pendente','portal',150.00,'Primeira extensão — Volume Brasileiro');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vb,150.00);

  -- Concluídos (histórico recente)
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_03, (CURRENT_DATE - 2)::timestamp + TIME '10:00',120,'concluido','portal',140.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_fio,140.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_04, (CURRENT_DATE - 3)::timestamp + TIME '11:00', 45,'concluido','admin',45.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_sob,45.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_07, (CURRENT_DATE - 5)::timestamp + TIME '09:00', 90,'concluido','portal',90.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_man,90.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_08, (CURRENT_DATE - 6)::timestamp + TIME '14:00',150,'concluido','portal',190.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,190.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_10, (CURRENT_DATE - 8)::timestamp + TIME '10:00',135,'concluido','portal',165.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vh,165.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est,cl_01, (CURRENT_DATE - 9)::timestamp + TIME '09:00',150,'concluido','portal',190.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s_vr,190.00);

  -- Falta e cancelado
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_05, (CURRENT_DATE - 4)::timestamp + TIME '15:00',120,'falta','portal',140.00,'Não compareceu e não avisou');

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est,cl_02, (CURRENT_DATE - 7)::timestamp + TIME '11:00', 90,'cancelado','portal', 90.00,'Cancelou com antecedência — reagendou pro mês seguinte');

  -- ======================================================================
  -- 9. ATENDIMENTOS MANUAIS (histórico financeiro registrado direto, sem
  --    passar pelo fluxo de agendamento — alimenta o faturamento do mês)
  -- ======================================================================
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est,cl_06,s_vr,  CURRENT_DATE - 33, 190.00,'Volume Russo — cliente satisfeita'),
    (est,cl_09,s_vh,  CURRENT_DATE - 28, 165.00,'Vol. Híbrido — resultado natural'),
    (est,cl_03,s_man, CURRENT_DATE - 24,  90.00,'Manutenção quinzenal'),
    (est,cl_11,s_fio, CURRENT_DATE - 20, 140.00,'Fio a fio clássico'),
    (est,cl_07,s_rem, CURRENT_DATE - 18,  35.00,'Removeu para dar uma pausa nos cílios naturais'),
    (est,cl_12,s_lft, CURRENT_DATE - 15, 110.00,'Lash lifting — primeira vez, adorou');

END $$;
