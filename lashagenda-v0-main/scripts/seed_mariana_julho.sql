-- =========================================================================
-- LASH AGENDA — STUDIO M LASH (MARIANA): DADOS DE JULHO 2026
--
-- Popula dados realistas para gravação de tutoriais em todas as telas:
--   • Dashboard  — faturamento do mês, novas clientes, agenda do dia
--   • Agenda     — agendamentos espalhados por todo o mês com statuses variados
--   • Clientes   — 13 clientes (10 existentes + 3 novas de julho)
--   • Atendimentos — histórico manual julho 01-02
--   • Financeiro — receita acumulada
--
-- Pré-requisito: seed_demo.sql já executado (cria studio-m-lash e os 10 clientes).
-- NÃO depende de seed_mariana_extra.sql.
--
-- ATENÇÃO: seed_demo.sql já insere alguns agendamentos futuros usando
-- CURRENT_DATE + N. Este script usa datas fixas de julho para não colidir.
-- =========================================================================

DO $$
DECLARE
  v_est UUID;

  -- Serviços do studio-m-lash
  v_fio UUID; v_vr UUID; v_vh UUID; v_vb UUID;
  v_lft UUID; v_spa UUID; v_sob UUID; v_hen UUID; v_man UUID; v_rem UUID;

  -- Clientes criadas pelo seed_demo.sql
  c_larissa     UUID;
  c_anacarolina UUID;
  c_juliana     UUID;
  c_patricia    UUID;
  c_rafaela     UUID;
  c_thais       UUID;
  c_isabela     UUID;
  c_marcia      UUID;
  c_vanessa     UUID;
  c_carolina    UUID;

  -- Novas clientes de julho 2026 (aparecem no dashboard como "novas clientes")
  c_fernanda  UUID;
  c_amanda    UUID;
  c_beatriz_m UUID;

  ag UUID;
BEGIN

  SELECT id INTO v_est FROM public.estabelecimentos WHERE slug = 'studio-m-lash';
  IF v_est IS NULL THEN
    RAISE EXCEPTION 'Estabelecimento studio-m-lash não encontrado. Rode seed_demo.sql antes.';
  END IF;

  -- ── Serviços ─────────────────────────────────────────────────────────────
  SELECT id INTO v_fio FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Fio a Fio Clássico';
  SELECT id INTO v_vr  FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Volume Russo';
  SELECT id INTO v_vh  FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Volume Híbrido';
  SELECT id INTO v_vb  FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Volume Brasileiro';
  SELECT id INTO v_lft FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Lash Lifting Completo';
  SELECT id INTO v_spa FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Spa de Cílios';
  SELECT id INTO v_sob FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Design de Sobrancelhas';
  SELECT id INTO v_hen FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Design com Henna';
  SELECT id INTO v_man FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Manutenção de Extensão';
  SELECT id INTO v_rem FROM public.servicos WHERE estabelecimento_id = v_est AND nome = 'Remoção de Extensão';

  -- ── Clientes do seed_demo ────────────────────────────────────────────────
  SELECT id INTO c_larissa     FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'larissa.fernandes@gmail.com';
  SELECT id INTO c_anacarolina FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'anacarolina.silva@hotmail.com';
  SELECT id INTO c_juliana     FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'juliana.santos@outlook.com';
  SELECT id INTO c_patricia    FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'patricia.mendes@gmail.com';
  SELECT id INTO c_rafaela     FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'rafaela.sousa@gmail.com';
  SELECT id INTO c_thais       FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'thais.carvalho@icloud.com';
  SELECT id INTO c_isabela     FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'isabela.rocha@gmail.com';
  SELECT id INTO c_marcia      FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'marcia.lima@yahoo.com.br';
  SELECT id INTO c_vanessa     FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'vanessa.pinto@gmail.com';
  SELECT id INTO c_carolina    FROM public.clientes WHERE estabelecimento_id = v_est AND email = 'carolina.ferreira@gmail.com';

  IF c_larissa IS NULL THEN
    RAISE EXCEPTION 'Clientes não encontrados. Rode seed_demo.sql antes deste script.';
  END IF;

  -- ======================================================================
  -- 1. NOVAS CLIENTES DE JULHO 2026
  --    Aparecem no dashboard como "novas clientes do mês"
  -- ======================================================================
  c_fernanda  := gen_random_uuid();
  c_amanda    := gen_random_uuid();
  c_beatriz_m := gen_random_uuid();

  INSERT INTO public.clientes
    (id, estabelecimento_id, nome, sobrenome, email, whatsapp, data_nascimento, observacoes, anamnese_lash, created_at)
  VALUES
    (c_fernanda, v_est,
      'Fernanda', 'Castro', 'fernanda.castro@gmail.com', '(11) 99887-6655', '1994-03-08',
      'Indicação da Larissa Fernandes. Primeira extensão de cílios.',
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      '2026-07-01 10:00:00-03'),
    (c_amanda, v_est,
      'Amanda', 'Teixeira', 'amanda.teixeira@gmail.com', '(11) 98776-5544', '1997-11-15',
      'Conheceu o Studio pelo Instagram. Quer começar com Fio a Fio para testar.',
      '{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      '2026-07-02 09:30:00-03'),
    (c_beatriz_m, v_est,
      'Beatriz', 'Mendonça', 'beatriz.mendonca@gmail.com', '(11) 97665-4433', '2001-06-20',
      'Noiva para setembro/2026. Quer testar Lash Lifting antes da cerimônia. Bem detalhista.',
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Delicado"}'::jsonb,
      '2026-07-02 14:00:00-03');

  -- ======================================================================
  -- 2. ATENDIMENTOS MANUAIS — Faturamento de julho até hoje (02/07)
  --
  --   01/07 (Ter): R$ 950,00  →  7 atendimentos
  --   02/07 (Qua): R$ 580,00  →  4 atendimentos (manhã concluída)
  --   ─────────────────────────────────────────
  --   TOTAL acumulado julho:  R$ 1.530,00
  -- ======================================================================
  INSERT INTO public.atendimentos
    (estabelecimento_id, cliente_id, servico_id, data_atendimento, valor_cobrado, observacoes)
  VALUES
    -- 01/07 (Terça) ────────────────────────────────────────────────────────
    (v_est, c_larissa,     v_vr,  '2026-07-01', 200.00, 'Volume Russo — renovação mensal'),
    (v_est, c_anacarolina, v_vr,  '2026-07-01', 200.00, 'Volume Russo — manutenção quinzenal'),
    (v_est, c_juliana,     v_fio, '2026-07-01', 150.00, 'Fio a Fio Clássico'),
    (v_est, c_patricia,    v_vh,  '2026-07-01', 180.00, 'Volume Híbrido — experimentou nova técnica'),
    (v_est, c_marcia,      v_man, '2026-07-01', 100.00, 'Manutenção de extensão — Volume Russo'),
    (v_est, c_thais,       v_hen, '2026-07-01',  70.00, 'Design com henna — evento no final de semana'),
    (v_est, c_vanessa,     v_sob, '2026-07-01',  50.00, 'Design de sobrancelhas'),
    -- 02/07 (Quarta) — manhã concluída ────────────────────────────────────
    (v_est, c_rafaela,     v_lft, '2026-07-02', 120.00, 'Lash Lifting Completo — pré-noivado, ficou incrível!'),
    (v_est, c_isabela,     v_vb,  '2026-07-02', 160.00, 'Volume Brasileiro — primeira vez, adorou'),
    (v_est, c_carolina,    v_fio, '2026-07-02', 150.00, 'Fio a Fio Clássico — voltou pós-parto!'),
    (v_est, c_fernanda,    v_fio, '2026-07-02', 150.00, 'Fio a Fio — primeira visita, cliente nova por indicação');

  -- ======================================================================
  -- 3. AGENDAMENTOS PASSADOS — 01/07 e manhã de 02/07
  --    Aparecem no histórico da agenda e no relatório de atendimentos
  -- ======================================================================

  -- ── 01/07 (Terça) ───────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_larissa, '2026-07-01 09:00:00-03', 150, 'concluido', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_anacarolina, '2026-07-01 11:30:00-03', 150, 'concluido', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_juliana, '2026-07-01 14:00:00-03', 120, 'concluido', 'admin', 150.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_fio, 150.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_patricia, '2026-07-01 16:30:00-03', 135, 'concluido', 'portal', 180.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vh, 180.00);

  -- 01/07 — falta (não compareceu, não avisou)
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_vanessa, '2026-07-01 17:30:00-03', 90, 'falta', 'portal', 100.00, 'Não compareceu e não avisou — entrar em contato');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  -- ── 02/07 manhã (Quarta) ────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_rafaela, '2026-07-02 09:00:00-03', 60, 'concluido', 'portal', 120.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_lft, 120.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_isabela, '2026-07-02 10:30:00-03', 120, 'concluido', 'admin', 160.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vb, 160.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_carolina, '2026-07-02 13:00:00-03', 120, 'concluido', 'portal', 150.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_fio, 150.00);

  -- ======================================================================
  -- 4. AGENDAMENTOS FUTUROS — agenda cheia para tutoriais
  --
  --  NOTA: seed_demo.sql já adicionou agendamentos usando CURRENT_DATE + N.
  --  Considerando CURRENT_DATE = 02/07/2026, seed_demo criou:
  --    03/07 09:00 Larissa VR + 11:00 Patrícia VR
  --    04/07 09:00 Thaís Manutenção
  --    05/07 09:00 Ana Carolina Fio
  --    07/07 10:00 Isabela VB
  --  Este script ocupa apenas os slots restantes de cada dia.
  -- ======================================================================

  -- ── 02/07 tarde (hoje) ──────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_amanda, '2026-07-02 15:00:00-03', 30, 'confirmado', 'portal', 50.00, 'Spa de cílios — cliente nova, avaliação inicial');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_spa, 50.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_vanessa, '2026-07-02 16:00:00-03', 90, 'confirmado', 'admin', 100.00, 'Manutenção remarcada — não compareceu em 01/07');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  -- ── 03/07 (Quinta) — seed_demo tem 09:00 e 11:00; ocupar tarde ──────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_beatriz_m, '2026-07-03 14:00:00-03', 60, 'confirmado', 'admin', 120.00, 'Lash Lifting — noiva setembro, primeira consulta');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_lft, 120.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_marcia, '2026-07-03 16:00:00-03', 45, 'confirmado', 'portal', 50.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_sob, 50.00);

  -- ── 04/07 (Sexta) — seed_demo tem 09:00 Thaís Manutenção (90min); bloqueio almoço 12-14 ──
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_fernanda, '2026-07-04 11:00:00-03', 60, 'confirmado', 'admin', 70.00, 'Design com henna — veio gostar após o Fio a Fio');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_hen, 70.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_carolina, '2026-07-04 14:30:00-03', 120, 'confirmado', 'portal', 150.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_fio, 150.00);

  -- ── 05/07 (Sábado, até 14h) — seed_demo tem 09:00 Ana Carolina Fio ──────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_juliana, '2026-07-05 11:30:00-03', 30, 'pendente', 'portal', 50.00, 'Spa de cílios — manutenção leve pré-final de semana');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_spa, 50.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_amanda, '2026-07-05 12:30:00-03', 45, 'pendente', 'portal', 50.00, 'Design de sobrancelhas — complemento ao spa');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_sob, 50.00);

  -- ── 07/07 (Segunda) — seed_demo tem 10:00 Isabela VB (120min, termina 12h) ──
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_rafaela, '2026-07-07 09:00:00-03', 60, 'confirmado', 'portal', 120.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_lft, 120.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_vanessa, '2026-07-07 13:00:00-03', 135, 'confirmado', 'portal', 180.00, 'Volume Híbrido — quer mudar do fio a fio');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vh, 180.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_anacarolina, '2026-07-07 16:30:00-03', 60, 'confirmado', 'portal', 70.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_hen, 70.00);

  -- ── 08/07 (Terça) ────────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_larissa, '2026-07-08 09:00:00-03', 150, 'confirmado', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_beatriz_m, '2026-07-08 11:30:00-03', 45, 'confirmado', 'admin', 50.00, 'Design de sobrancelhas — alinhamento para noivado');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_sob, 50.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_marcia, '2026-07-08 14:00:00-03', 150, 'confirmado', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  -- 08/07 — cancelamento (dá realismo à lista de agendamentos)
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_thais, '2026-07-08 16:30:00-03', 90, 'cancelado', 'portal', 100.00, 'Cancelou com 6h de antecedência — viagem de última hora');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  -- ── 09/07 (Quarta) ───────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_fernanda, '2026-07-09 09:00:00-03', 150, 'confirmado', 'admin', 200.00, 'Volume Russo — evoluiu do Fio a Fio após 1ª visita');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_thais, '2026-07-09 11:30:00-03', 60, 'confirmado', 'portal', 120.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_lft, 120.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_carolina, '2026-07-09 14:00:00-03', 90, 'pendente', 'portal', 100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_amanda, '2026-07-09 16:30:00-03', 30, 'pendente', 'portal', 50.00, 'Spa de cílios — retorno mensal');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_spa, 50.00);

  -- ── 10/07 (Quinta) ───────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_juliana, '2026-07-10 09:00:00-03', 150, 'confirmado', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_vanessa, '2026-07-10 11:30:00-03', 135, 'pendente', 'portal', 180.00, 'Volume Híbrido — retorno após teste na semana anterior');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vh, 180.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_patricia, '2026-07-10 14:30:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  -- ── 11/07 (Sexta) ────────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_isabela, '2026-07-11 09:00:00-03', 90, 'confirmado', 'portal', 100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_rafaela, '2026-07-11 11:00:00-03', 60, 'confirmado', 'admin', 70.00, 'Design com henna — pré-evento de casamento da amiga');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_hen, 70.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_amanda, '2026-07-11 14:00:00-03', 120, 'pendente', 'portal', 150.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_fio, 150.00);

  -- ── 12/07 (Sábado, até 14h) ─────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_marcia, '2026-07-12 09:00:00-03', 90, 'confirmado', 'portal', 100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_beatriz_m, '2026-07-12 11:00:00-03', 45, 'confirmado', 'portal', 50.00, 'Design sobrancelhas — noiva quer ver variações antes de fechar');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_sob, 50.00);

  -- ── 14/07 (Segunda) ──────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_anacarolina, '2026-07-14 09:00:00-03', 150, 'confirmado', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_juliana, '2026-07-14 11:30:00-03', 90, 'confirmado', 'portal', 100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_beatriz_m, '2026-07-14 14:00:00-03', 60, 'pendente', 'portal', 120.00, 'Lash Lifting — decisão final antes do noivado');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_lft, 120.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_thais, '2026-07-14 16:00:00-03', 45, 'pendente', 'portal', 50.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_sob, 50.00);

  -- ── 15/07 (Terça) ────────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_larissa, '2026-07-15 09:00:00-03', 90, 'pendente', 'portal', 100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_carolina, '2026-07-15 11:00:00-03', 135, 'pendente', 'portal', 180.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vh, 180.00);

  -- 16-18/07 → bloqueado (viagem — já criado pelo seed_demo.sql)

  -- ── 21/07 (Segunda) ──────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_patricia, '2026-07-21 09:00:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_marcia, '2026-07-21 11:30:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_isabela, '2026-07-21 14:30:00-03', 135, 'pendente', 'portal', 180.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vh, 180.00);

  -- ── 22/07 (Terça) ────────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_rafaela, '2026-07-22 09:00:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_fernanda, '2026-07-22 11:30:00-03', 90, 'pendente', 'portal', 100.00, 'Manutenção do Volume Russo da semana passada');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_amanda, '2026-07-22 14:00:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  -- ── 25/07 (Sexta) ────────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_larissa, '2026-07-25 09:00:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_anacarolina, '2026-07-25 11:30:00-03', 90, 'pendente', 'portal', 100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_beatriz_m, '2026-07-25 14:00:00-03', 60, 'pendente', 'admin', 120.00, 'Lash Lifting — última sessão pré-casamento em setembro');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_lft, 120.00);

  -- ── 28/07 (Segunda) ──────────────────────────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_juliana, '2026-07-28 09:00:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_vanessa, '2026-07-28 11:30:00-03', 135, 'pendente', 'portal', 180.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vh, 180.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_thais, '2026-07-28 14:30:00-03', 60, 'pendente', 'portal', 70.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_hen, 70.00);

  -- ── 31/07 (Quinta) — fechamento do mês ───────────────────────────────────
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_marcia, '2026-07-31 09:00:00-03', 150, 'pendente', 'portal', 200.00, 'Volume Russo — manutenção mensal');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_patricia, '2026-07-31 11:30:00-03', 150, 'pendente', 'portal', 200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_vr, 200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado, observacoes) VALUES
    (ag, v_est, c_isabela, '2026-07-31 14:30:00-03', 90, 'pendente', 'portal', 100.00, 'Manutenção — fechar julho com tudo em dia');
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_man, 100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id, estabelecimento_id, cliente_id, data_hora, duracao_minutos, status, origem, valor_cobrado) VALUES
    (ag, v_est, c_fernanda, '2026-07-31 16:30:00-03', 45, 'pendente', 'admin', 50.00);
  INSERT INTO public.agendamento_servicos (agendamento_id, servico_id, valor_cobrado) VALUES (ag, v_sob, 50.00);

  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'Seed de julho 2026 inserido com sucesso!';
  RAISE NOTICE '---------------------------------------------------------';
  RAISE NOTICE 'Novas clientes cadastradas em julho: 3';
  RAISE NOTICE '  • Fernanda Castro     (01/07)';
  RAISE NOTICE '  • Amanda Teixeira     (02/07)';
  RAISE NOTICE '  • Beatriz Mendonça    (02/07 — noiva set/26)';
  RAISE NOTICE '---------------------------------------------------------';
  RAISE NOTICE 'Atendimentos manuais inseridos: 11';
  RAISE NOTICE '  • 01/07: 7 atendimentos = R$ 950,00';
  RAISE NOTICE '  • 02/07: 4 atendimentos = R$ 580,00';
  RAISE NOTICE '  TOTAL JULHO ATÉ AGORA: R$ 1.530,00';
  RAISE NOTICE '---------------------------------------------------------';
  RAISE NOTICE 'Agendamentos criados para o mês todo com statuses variados:';
  RAISE NOTICE '  confirmado / pendente / cancelado / falta / concluido';
  RAISE NOTICE '=========================================================';

END;
$$;

-- ======================================================================
-- IMAGENS DOS SERVIÇOS
-- O seed bypassa o trigger que normalmente preenche imagem_url.
-- Este bloco restaura as URLs padrão do Storage.
-- ======================================================================
DO $$
DECLARE
  v_est  UUID;
  v_base TEXT := 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/';
  v_count INT;
BEGIN
  SELECT id INTO v_est FROM public.estabelecimentos WHERE slug = 'studio-m-lash';
  IF v_est IS NULL THEN
    RAISE NOTICE 'studio-m-lash não encontrado — pulando atualização de imagens.';
    RETURN;
  END IF;

  UPDATE public.servicos SET imagem_url = v_base || 'Fio%20a%20Fio%20Classico.png'
    WHERE estabelecimento_id = v_est AND nome = 'Fio a Fio Clássico';
  UPDATE public.servicos SET imagem_url = v_base || 'Volume%20Russo.png'
    WHERE estabelecimento_id = v_est AND nome = 'Volume Russo';
  UPDATE public.servicos SET imagem_url = v_base || 'Volume%20Hibrido.png'
    WHERE estabelecimento_id = v_est AND nome = 'Volume Híbrido';
  UPDATE public.servicos SET imagem_url = v_base || 'Volume%20Brasileiro%20(Cilios%20Y).png'
    WHERE estabelecimento_id = v_est AND nome = 'Volume Brasileiro';
  UPDATE public.servicos SET imagem_url = v_base || 'Lash%20Lifting%20%20Completo.png'
    WHERE estabelecimento_id = v_est AND nome = 'Lash Lifting Completo';
  UPDATE public.servicos SET imagem_url = v_base || 'Spa%20de%20Cilios.png'
    WHERE estabelecimento_id = v_est AND nome = 'Spa de Cílios';
  UPDATE public.servicos SET imagem_url = v_base || 'Design%20de%20Sobrancelhas%20Simples.png'
    WHERE estabelecimento_id = v_est AND nome = 'Design de Sobrancelhas';
  UPDATE public.servicos SET imagem_url = v_base || 'Design%20com%20Henna.png'
    WHERE estabelecimento_id = v_est AND nome = 'Design com Henna';
  UPDATE public.servicos SET imagem_url = v_base || 'Manutencao%20de%20Extensao.png'
    WHERE estabelecimento_id = v_est AND nome = 'Manutenção de Extensão';
  UPDATE public.servicos SET imagem_url = v_base || 'Remocao%20de%20Extensao.png'
    WHERE estabelecimento_id = v_est AND nome = 'Remoção de Extensão';

  SELECT COUNT(*) INTO v_count
    FROM public.servicos
    WHERE estabelecimento_id = v_est AND imagem_url IS NOT NULL;

  RAISE NOTICE '% serviços do studio-m-lash agora têm imagem.', v_count;
END;
$$;
