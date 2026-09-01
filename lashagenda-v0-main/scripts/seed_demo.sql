-- =========================================================================
-- LASH AGENDA — SEED DE DADOS DEMO
-- Popula o banco com 5 profissionais e 10 clientes cada para marketing.
-- Execute no SQL Editor do Supabase (será ignorado pelo RLS pois roda
-- como service_role no editor).
-- =========================================================================

DO $$
DECLARE
  -- ── Estabelecimentos ──────────────────────────────────────────────────
  est1 UUID; est2 UUID; est3 UUID; est4 UUID; est5 UUID;

  -- ── Usuários (profissionais) ──────────────────────────────────────────
  usr1 UUID; usr2 UUID; usr3 UUID; usr4 UUID; usr5 UUID;

  -- ── Categorias — Est1 (Mariana) ───────────────────────────────────────
  c1_ext UUID; c1_lft UUID; c1_des UUID; c1_man UUID;
  -- Categorias — Est2 (Beatriz)
  c2_ext UUID; c2_lft UUID; c2_des UUID; c2_man UUID;
  -- Categorias — Est3 (Gabriela)
  c3_ext UUID; c3_lft UUID; c3_des UUID; c3_man UUID;
  -- Categorias — Est4 (Fernanda)
  c4_ext UUID; c4_lft UUID; c4_des UUID; c4_man UUID;
  -- Categorias — Est5 (Camila)
  c5_ext UUID; c5_lft UUID; c5_des UUID; c5_man UUID;

  -- ── Serviços — Est1 ───────────────────────────────────────────────────
  s1_fio UUID; s1_vr UUID; s1_vh UUID; s1_vb UUID;
  s1_lft UUID; s1_spa UUID;
  s1_sob UUID; s1_hen UUID;
  s1_man UUID; s1_rem UUID;
  -- Serviços — Est2
  s2_fio UUID; s2_vr UUID; s2_vh UUID;
  s2_lft UUID;
  s2_sob UUID;
  s2_man UUID; s2_rem UUID;
  -- Serviços — Est3
  s3_fio UUID; s3_vr UUID;
  s3_lft UUID;
  s3_sob UUID; s3_hen UUID;
  s3_man UUID;
  -- Serviços — Est4
  s4_fio UUID; s4_vr UUID; s4_vh UUID;
  s4_lft UUID;
  s4_sob UUID;
  s4_man UUID;
  -- Serviços — Est5
  s5_fio UUID; s5_vr UUID; s5_vh UUID;
  s5_lft UUID;
  s5_brow UUID;
  s5_man UUID;

  -- ── Clientes — Est1 (Mariana) ─────────────────────────────────────────
  cl1_01 UUID; cl1_02 UUID; cl1_03 UUID; cl1_04 UUID; cl1_05 UUID;
  cl1_06 UUID; cl1_07 UUID; cl1_08 UUID; cl1_09 UUID; cl1_10 UUID;
  -- Clientes — Est2 (Beatriz)
  cl2_01 UUID; cl2_02 UUID; cl2_03 UUID; cl2_04 UUID; cl2_05 UUID;
  cl2_06 UUID; cl2_07 UUID; cl2_08 UUID; cl2_09 UUID; cl2_10 UUID;
  -- Clientes — Est3 (Gabriela)
  cl3_01 UUID; cl3_02 UUID; cl3_03 UUID; cl3_04 UUID; cl3_05 UUID;
  cl3_06 UUID; cl3_07 UUID; cl3_08 UUID; cl3_09 UUID; cl3_10 UUID;
  -- Clientes — Est4 (Fernanda)
  cl4_01 UUID; cl4_02 UUID; cl4_03 UUID; cl4_04 UUID; cl4_05 UUID;
  cl4_06 UUID; cl4_07 UUID; cl4_08 UUID; cl4_09 UUID; cl4_10 UUID;
  -- Clientes — Est5 (Camila)
  cl5_01 UUID; cl5_02 UUID; cl5_03 UUID; cl5_04 UUID; cl5_05 UUID;
  cl5_06 UUID; cl5_07 UUID; cl5_08 UUID; cl5_09 UUID; cl5_10 UUID;

  -- ── Agendamentos ──────────────────────────────────────────────────────
  ag UUID;

BEGIN

  -- ======================================================================
  -- 1. ESTABELECIMENTOS
  -- ======================================================================
  est1 := gen_random_uuid(); est2 := gen_random_uuid();
  est3 := gen_random_uuid(); est4 := gen_random_uuid();
  est5 := gen_random_uuid();

  INSERT INTO public.estabelecimentos (id, nome_negocio, slug, plano, status_assinatura, trial_ends_at, created_at) VALUES
    (est1, 'Studio M Lash',            'studio-m-lash',             'premium', 'ativo',  NULL,                        NOW() - INTERVAL '4 months'),
    (est2, 'Bê Lash Studio',           'be-lash-studio',            'premium', 'ativo',  NULL,                        NOW() - INTERVAL '6 months'),
    (est3, 'Gabi Costa Cílios',        'gabi-costa-cilios',         'basico',  'ativo',  NULL,                        NOW() - INTERVAL '3 months'),
    (est4, 'Fernanda Lash Premium',    'fernanda-lash-premium',     'premium', 'ativo',  NULL,                        NOW() - INTERVAL '8 months'),
    (est5, 'Camila Rodrigues Lash',    'camila-rodrigues-lash',     'premium', 'trial',  NOW() + INTERVAL '7 days',   NOW() - INTERVAL '1 week');

  -- ======================================================================
  -- 2. CONFIGURAÇÃO DO NEGÓCIO
  -- ======================================================================
  INSERT INTO public.configuracao_negocio
    (estabelecimento_id, nome_negocio, descricao, instagram, endereco, aprovacao_automatica, antecedencia_cancelamento_horas, paleta_cores, modo_escuro) VALUES
    (est1, 'Studio M Lash',         'Especialista em Volume Russo e Mega Volume. Atendo em São Paulo com hora marcada.',
      '@studiomlash',        'Rua das Flores, 142, Pinheiros — São Paulo, SP',   true,  24, 'rosa_rose',  false),
    (est2, 'Bê Lash Studio',        'Cílios que falam por você. Atendo no conforto do seu lar ou no meu home studio.',
      '@belashstudio',       'Av. Copacabana, 800, apto 203 — Rio de Janeiro, RJ', false, 48, 'rosa_blush', false),
    (est3, 'Gabi Costa Cílios',     'Lash designer certificada, apaixonada por deixar cada olhar único e poderoso.',
      '@gabicostacilos',     'Rua Sapucaí, 55 — Belo Horizonte, MG',              false, 24, 'lavanda',    false),
    (est4, 'Fernanda Lash Premium', 'Olhares transformados com técnica e carinho. Certificada em Volume Russo e Híbrido.',
      '@fernandalashpremium','Rua XV de Novembro, 320 — Curitiba, PR',             true,  24, 'nude',       false),
    (est5, 'Camila Rodrigues Lash', 'Extensões de luxo com insumos importados. Resultados que encantam.',
      '@camilarodrigueslash','SHLS 716 Bloco B, sala 210 — Brasília, DF',          true,  72, 'terra',      true);

  -- ======================================================================
  -- 3. USUÁRIOS (PROFISSIONAIS)
  -- ======================================================================
  -- IDs vêm de auth.users (não são gerados aqui) porque public.usuarios.id
  -- precisa ser o mesmo ID da conta de autenticação correspondente — é
  -- assim que o login (signInWithPassword) resolve o profissional certo.
  -- Rode antes: node scripts/create_demo_auth_users.mjs
  SELECT id INTO usr1 FROM auth.users WHERE email = 'mariana@studiomlash.com.br';
  SELECT id INTO usr2 FROM auth.users WHERE email = 'beatriz@belashstudio.com.br';
  SELECT id INTO usr3 FROM auth.users WHERE email = 'gabriela@gabicostacilos.com.br';
  SELECT id INTO usr4 FROM auth.users WHERE email = 'fernanda@fernandalash.com.br';
  SELECT id INTO usr5 FROM auth.users WHERE email = 'camila@camilalash.com.br';

  IF usr1 IS NULL OR usr2 IS NULL OR usr3 IS NULL OR usr4 IS NULL OR usr5 IS NULL THEN
    RAISE EXCEPTION 'Contas de autenticação demo não encontradas. Rode "node scripts/create_demo_auth_users.mjs" antes deste seed.';
  END IF;

  INSERT INTO public.usuarios (id, estabelecimento_id, nome, email, role, telefone, created_at) VALUES
    (usr1, est1, 'Mariana Lima',       'mariana@studiomlash.com.br',      'profissional', '(11) 99201-3344', NOW() - INTERVAL '4 months'),
    (usr2, est2, 'Beatriz Oliveira',   'beatriz@belashstudio.com.br',     'profissional', '(21) 98876-5541', NOW() - INTERVAL '6 months'),
    (usr3, est3, 'Gabriela Costa',     'gabriela@gabicostacilos.com.br',  'profissional', '(31) 97654-3210', NOW() - INTERVAL '3 months'),
    (usr4, est4, 'Fernanda Alves',     'fernanda@fernandalash.com.br',    'profissional', '(41) 96543-2109', NOW() - INTERVAL '8 months'),
    (usr5, est5, 'Camila Rodrigues',   'camila@camilalash.com.br',        'profissional', '(61) 95432-1098', NOW() - INTERVAL '1 week');

  -- ======================================================================
  -- 4. HORÁRIOS DE ATENDIMENTO
  -- ======================================================================
  -- Mariana: Seg–Sáb, 09–18
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est1,1,'09:00','18:00'),(est1,2,'09:00','18:00'),(est1,3,'09:00','18:00'),
    (est1,4,'09:00','18:00'),(est1,5,'09:00','18:00'),(est1,6,'09:00','14:00');
  -- Beatriz: Seg–Sex, 10–19
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est2,1,'10:00','19:00'),(est2,2,'10:00','19:00'),(est2,3,'10:00','19:00'),
    (est2,4,'10:00','19:00'),(est2,5,'10:00','19:00');
  -- Gabriela: Ter–Sáb, 09–17
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est3,2,'09:00','17:00'),(est3,3,'09:00','17:00'),(est3,4,'09:00','17:00'),
    (est3,5,'09:00','17:00'),(est3,6,'09:00','13:00');
  -- Fernanda: Seg–Sex, 08–17
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est4,1,'08:00','17:00'),(est4,2,'08:00','17:00'),(est4,3,'08:00','17:00'),
    (est4,4,'08:00','17:00'),(est4,5,'08:00','17:00');
  -- Camila: Seg–Sáb, 10–18
  INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim) VALUES
    (est5,1,'10:00','18:00'),(est5,2,'10:00','18:00'),(est5,3,'10:00','18:00'),
    (est5,4,'10:00','18:00'),(est5,5,'10:00','18:00'),(est5,6,'10:00','15:00');

  -- ======================================================================
  -- 5. CATEGORIAS DE SERVIÇO
  -- ======================================================================
  c1_ext:=gen_random_uuid(); c1_lft:=gen_random_uuid(); c1_des:=gen_random_uuid(); c1_man:=gen_random_uuid();
  c2_ext:=gen_random_uuid(); c2_lft:=gen_random_uuid(); c2_des:=gen_random_uuid(); c2_man:=gen_random_uuid();
  c3_ext:=gen_random_uuid(); c3_lft:=gen_random_uuid(); c3_des:=gen_random_uuid(); c3_man:=gen_random_uuid();
  c4_ext:=gen_random_uuid(); c4_lft:=gen_random_uuid(); c4_des:=gen_random_uuid(); c4_man:=gen_random_uuid();
  c5_ext:=gen_random_uuid(); c5_lft:=gen_random_uuid(); c5_des:=gen_random_uuid(); c5_man:=gen_random_uuid();

  INSERT INTO public.categorias_servico (id, estabelecimento_id, nome, ordem) VALUES
    (c1_ext,est1,'Extensão de Cílios',1),(c1_lft,est1,'Lash Lifting & Tratamentos',2),(c1_des,est1,'Design de Sobrancelhas',3),(c1_man,est1,'Manutenções e Remoções',4),
    (c2_ext,est2,'Extensão de Cílios',1),(c2_lft,est2,'Lash Lifting & Tratamentos',2),(c2_des,est2,'Design de Sobrancelhas',3),(c2_man,est2,'Manutenções e Remoções',4),
    (c3_ext,est3,'Extensão de Cílios',1),(c3_lft,est3,'Lash Lifting & Tratamentos',2),(c3_des,est3,'Design de Sobrancelhas',3),(c3_man,est3,'Manutenções e Remoções',4),
    (c4_ext,est4,'Extensão de Cílios',1),(c4_lft,est4,'Lash Lifting & Tratamentos',2),(c4_des,est4,'Design de Sobrancelhas',3),(c4_man,est4,'Manutenções e Remoções',4),
    (c5_ext,est5,'Extensão de Cílios',1),(c5_lft,est5,'Lash Lifting & Tratamentos',2),(c5_des,est5,'Design de Sobrancelhas',3),(c5_man,est5,'Manutenções e Remoções',4);

  -- ======================================================================
  -- 6. SERVIÇOS
  -- ======================================================================
  s1_fio:=gen_random_uuid(); s1_vr:=gen_random_uuid(); s1_vh:=gen_random_uuid(); s1_vb:=gen_random_uuid();
  s1_lft:=gen_random_uuid(); s1_spa:=gen_random_uuid();
  s1_sob:=gen_random_uuid(); s1_hen:=gen_random_uuid();
  s1_man:=gen_random_uuid(); s1_rem:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,categoria_id,nome,duracao_minutos,valor,ativo) VALUES
    (s1_fio,est1,c1_ext,'Fio a Fio Clássico',120,150.00,true),
    (s1_vr, est1,c1_ext,'Volume Russo',       150,200.00,true),
    (s1_vh, est1,c1_ext,'Volume Híbrido',     135,180.00,true),
    (s1_vb, est1,c1_ext,'Volume Brasileiro',  120,160.00,true),
    (s1_lft,est1,c1_lft,'Lash Lifting Completo',60,120.00,true),
    (s1_spa,est1,c1_lft,'Spa de Cílios',      30, 50.00,true),
    (s1_sob,est1,c1_des,'Design de Sobrancelhas',45,50.00,true),
    (s1_hen,est1,c1_des,'Design com Henna',   60, 70.00,true),
    (s1_man,est1,c1_man,'Manutenção de Extensão',90,100.00,true),
    (s1_rem,est1,c1_man,'Remoção de Extensão',45, 40.00,true);

  s2_fio:=gen_random_uuid(); s2_vr:=gen_random_uuid(); s2_vh:=gen_random_uuid();
  s2_lft:=gen_random_uuid(); s2_sob:=gen_random_uuid();
  s2_man:=gen_random_uuid(); s2_rem:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,categoria_id,nome,duracao_minutos,valor,ativo) VALUES
    (s2_fio,est2,c2_ext,'Fio a Fio Clássico',120,140.00,true),
    (s2_vr, est2,c2_ext,'Volume Russo',       150,190.00,true),
    (s2_vh, est2,c2_ext,'Volume Híbrido',     135,170.00,true),
    (s2_lft,est2,c2_lft,'Lash Lifting Completo',60,110.00,true),
    (s2_sob,est2,c2_des,'Design de Sobrancelhas',45,45.00,true),
    (s2_man,est2,c2_man,'Manutenção de Extensão',90,95.00,true),
    (s2_rem,est2,c2_man,'Remoção de Extensão',45, 35.00,true);

  s3_fio:=gen_random_uuid(); s3_vr:=gen_random_uuid();
  s3_lft:=gen_random_uuid(); s3_sob:=gen_random_uuid(); s3_hen:=gen_random_uuid();
  s3_man:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,categoria_id,nome,duracao_minutos,valor,ativo) VALUES
    (s3_fio,est3,c3_ext,'Fio a Fio Clássico', 120,130.00,true),
    (s3_vr, est3,c3_ext,'Volume Russo',        150,175.00,true),
    (s3_lft,est3,c3_lft,'Lash Lifting',         60,100.00,true),
    (s3_sob,est3,c3_des,'Design de Sobrancelhas',45,45.00,true),
    (s3_hen,est3,c3_des,'Design com Henna',     60, 65.00,true),
    (s3_man,est3,c3_man,'Manutenção de Extensão',90,90.00,true);

  s4_fio:=gen_random_uuid(); s4_vr:=gen_random_uuid(); s4_vh:=gen_random_uuid();
  s4_lft:=gen_random_uuid(); s4_sob:=gen_random_uuid(); s4_man:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,categoria_id,nome,duracao_minutos,valor,ativo) VALUES
    (s4_fio,est4,c4_ext,'Fio a Fio Clássico', 120,155.00,true),
    (s4_vr, est4,c4_ext,'Volume Russo',        150,210.00,true),
    (s4_vh, est4,c4_ext,'Volume Híbrido',      135,185.00,true),
    (s4_lft,est4,c4_lft,'Lash Lifting Completo',60,115.00,true),
    (s4_sob,est4,c4_des,'Design de Sobrancelhas',45,55.00,true),
    (s4_man,est4,c4_man,'Manutenção de Extensão',90,105.00,true);

  s5_fio:=gen_random_uuid(); s5_vr:=gen_random_uuid(); s5_vh:=gen_random_uuid();
  s5_lft:=gen_random_uuid(); s5_brow:=gen_random_uuid(); s5_man:=gen_random_uuid();

  INSERT INTO public.servicos (id,estabelecimento_id,categoria_id,nome,duracao_minutos,valor,ativo) VALUES
    (s5_fio, est5,c5_ext,'Fio a Fio Clássico',  120,190.00,true),
    (s5_vr,  est5,c5_ext,'Volume Russo Premium', 150,260.00,true),
    (s5_vh,  est5,c5_ext,'Volume Híbrido',       135,230.00,true),
    (s5_lft, est5,c5_lft,'Lash Lifting Completo', 60,150.00,true),
    (s5_brow,est5,c5_des,'Brow Lamination',        60,160.00,true),
    (s5_man, est5,c5_man,'Manutenção de Extensão', 90,140.00,true);

  -- Variações da Manutenção (Est1)
  INSERT INTO public.variacoes_servico (servico_id,nome,duracao_minutos,valor) VALUES
    (s1_man,'Manutenção Fio a Fio',   90, 90.00),
    (s1_man,'Manutenção Vol. Híbrido',100,110.00),
    (s1_man,'Manutenção Volume Russo',120,120.00);
  -- Variações da Manutenção (Est4)
  INSERT INTO public.variacoes_servico (servico_id,nome,duracao_minutos,valor) VALUES
    (s4_man,'Manutenção Fio a Fio',   90, 95.00),
    (s4_man,'Manutenção Volume Russo',120,125.00);

  -- ======================================================================
  -- 7. BLOQUEIOS DE AGENDA
  -- ======================================================================
  INSERT INTO public.bloqueios_agenda (estabelecimento_id,data_inicio,data_fim,motivo,dia_inteiro) VALUES
    (est1, CURRENT_DATE + 14, CURRENT_DATE + 16, 'Viagem a trabalho — curso avançado de Mega Volume', true),
    (est2, CURRENT_DATE + 7,  CURRENT_DATE + 7,  'Consulta médica', true),
    (est4, CURRENT_DATE + 21, CURRENT_DATE + 23, 'Férias', true),
    (est5, CURRENT_DATE + 3,  CURRENT_DATE + 3,  'Tarde bloqueada — curso online', false);

  -- Bloqueio com horário específico (tarde bloqueada para almoço)
  INSERT INTO public.bloqueios_agenda (estabelecimento_id,data_inicio,data_fim,motivo,dia_inteiro,hora_inicio,hora_fim) VALUES
    (est1, CURRENT_DATE + 2, CURRENT_DATE + 2, 'Almoço de aniversário', false, '12:00', '14:00'),
    (est3, CURRENT_DATE + 5, CURRENT_DATE + 5, 'Horário de almoço', false, '12:00', '13:30');

  -- ======================================================================
  -- 8. CLIENTES — EST1 (Mariana Lima — São Paulo)
  -- ======================================================================
  cl1_01:=gen_random_uuid(); cl1_02:=gen_random_uuid(); cl1_03:=gen_random_uuid();
  cl1_04:=gen_random_uuid(); cl1_05:=gen_random_uuid(); cl1_06:=gen_random_uuid();
  cl1_07:=gen_random_uuid(); cl1_08:=gen_random_uuid(); cl1_09:=gen_random_uuid();
  cl1_10:=gen_random_uuid();

  INSERT INTO public.clientes (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,alergias,anamnese_lash,created_at) VALUES
    (cl1_01,est1,'Larissa','Fernandes','larissa.fernandes@gmail.com','(11) 99123-4567','1995-03-14',
      'Prefere horários pela manhã. Veio por indicação da Ana Carolina.',
      NULL,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl1_02,est1,'Ana Carolina','Silva','anacarolina.silva@hotmail.com','(11) 98234-5678','1992-07-22',
      'Cliente fiel desde a abertura do estúdio. Sempre pontual.',
      NULL,
      '{"curvatura":"CC","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '4 months'),
    (cl1_03,est1,'Juliana','Santos','juliana.santos@outlook.com','(11) 97345-6789','1998-11-05',
      'Pele sensível ao redor dos olhos. Usar cola de baixa sensibilidade.',
      'Sensibilidade à cola comum. Usar cola para pele sensível.',
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":true,"estilo":"Delicado"}'::jsonb,
      NOW() - INTERVAL '2 months'),
    (cl1_04,est1,'Patrícia','Mendes','patricia.mendes@gmail.com','(11) 96456-7890','1989-01-30',
      'Gosta de cílios bem dramáticos para fotos. Trabalha como influenciadora.',
      NULL,
      '{"curvatura":"D","espessura":"0.10","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Dramático"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl1_05,est1,'Rafaela','Sousa','rafaela.sousa@gmail.com','(11) 95567-8901','2000-05-18',
      'Noiva em outubro. Veio do Instagram.',
      NULL,
      '{"curvatura":"D","espessura":"0.07","mapping":"Efeito Molhado","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '1 month'),
    (cl1_06,est1,'Thaís','Carvalho','thais.carvalho@icloud.com','(11) 94678-9012','1994-09-12',
      'Professora. Prefere cílios discretos para o trabalho.',
      NULL,
      '{"curvatura":"B","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Discreto"}'::jsonb,
      NOW() - INTERVAL '2 months'),
    (cl1_07,est1,'Isabela','Rocha','isabela.rocha@gmail.com','(11) 93789-0123','1997-04-25',
      'Cílios naturais curtos. Precisa de curvatura mais acentuada.',
      NULL,
      '{"curvatura":"L","espessura":"0.07","mapping":"Efeito Boneca","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Volumoso"}'::jsonb,
      NOW() - INTERVAL '6 weeks'),
    (cl1_08,est1,'Márcia','Lima','marcia.lima@yahoo.com.br','(11) 92890-1234','1985-12-03',
      'Veio de salão concorrente. Gostou muito da técnica. Retorno mensal.',
      NULL,
      '{"curvatura":"CC","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      NOW() - INTERVAL '5 weeks'),
    (cl1_09,est1,'Vanessa','Pinto','vanessa.pinto@gmail.com','(11) 91901-2345','1991-08-16',
      'Tem olhos puxados. Mapping específico para valorizar o formato.',
      'Rinite alérgica — avisar se usar algum produto com fragrância.',
      '{"curvatura":"C","espessura":"0.07","mapping":"Fox Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Sofisticado"}'::jsonb,
      NOW() - INTERVAL '7 weeks'),
    (cl1_10,est1,'Carolina','Ferreira','carolina.ferreira@gmail.com','(11) 90012-3456','1996-02-28',
      'Gestante — 5 meses. Ciente das recomendações médicas. Aguardando pós-parto para extensão.',
      NULL,
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '3 weeks');

  -- ======================================================================
  -- 8b. CLIENTES — EST2 (Beatriz Oliveira — Rio de Janeiro)
  -- ======================================================================
  cl2_01:=gen_random_uuid(); cl2_02:=gen_random_uuid(); cl2_03:=gen_random_uuid();
  cl2_04:=gen_random_uuid(); cl2_05:=gen_random_uuid(); cl2_06:=gen_random_uuid();
  cl2_07:=gen_random_uuid(); cl2_08:=gen_random_uuid(); cl2_09:=gen_random_uuid();
  cl2_10:=gen_random_uuid();

  INSERT INTO public.clientes (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,alergias,anamnese_lash,created_at) VALUES
    (cl2_01,est2,'Fernanda','Gomes','fernanda.gomes@gmail.com','(21) 99234-5670','1993-06-10',
      'Mora em Ipanema. Prefere atendimento às terças.',NULL,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      NOW() - INTERVAL '5 months'),
    (cl2_02,est2,'Camila','Borges','camila.borges@hotmail.com','(21) 98345-6781','1990-09-03',
      'Cliente VIP. Sempre agenda com 2 semanas de antecedência.',NULL,
      '{"curvatura":"CC","espessura":"0.10","mapping":"Mega Volume","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Volumoso"}'::jsonb,
      NOW() - INTERVAL '6 months'),
    (cl2_03,est2,'Bianca','Martins','bianca.martins@gmail.com','(21) 97456-7892','1999-01-19',
      'Estudante de medicina. Horários variados.',NULL,
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '2 months'),
    (cl2_04,est2,'Letícia','Nunes','leticia.nunes@icloud.com','(21) 96567-8903','1988-04-22',
      'Advogada. Precisa de aparência profissional.',NULL,
      '{"curvatura":"B","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Discreto"}'::jsonb,
      NOW() - INTERVAL '4 months'),
    (cl2_05,est2,'Monique','Azevedo','monique.azevedo@gmail.com','(21) 95678-9014','2001-07-31',
      'Faz academia todos os dias. Orientada sobre cuidados pós extensão.',NULL,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Marcante"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl2_06,est2,'Priscila','Ramos','priscila.ramos@outlook.com','(21) 94789-0125','1995-11-14',
      'Frequenta praia regularmente. Orientada sobre cuidados com maresia.',NULL,
      '{"curvatura":"CC","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Volumoso"}'::jsonb,
      NOW() - INTERVAL '3 months'),
    (cl2_07,est2,'Juliana','Castro','juliana.castro@gmail.com','(21) 93890-1236','1997-02-08',
      'Modelo. Precisa de cílios perfeitos para trabalho.',NULL,
      '{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Dramático"}'::jsonb,
      NOW() - INTERVAL '2 months'),
    (cl2_08,est2,'Andressa','Lima','andressa.lima@gmail.com','(21) 92901-2347','1986-08-27',
      'Mãe de 3 filhos. Horários apenas pela manhã.',NULL,
      '{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '5 months'),
    (cl2_09,est2,'Thaísa','Vieira','thaisa.vieira@gmail.com','(21) 91012-3458','2002-03-15',
      'Primeira extensão. Bem ansiosa, atendida com calma.',NULL,
      '{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false,"estilo":"Natural"}'::jsonb,
      NOW() - INTERVAL '5 weeks'),
    (cl2_10,est2,'Roberta','Campos','roberta.campos@yahoo.com.br','(21) 90123-4569','1983-12-01',
      'Empreendedora. Aparência é prioridade.',
      'Alergia a látex — usar luvas sem látex.',
      '{"curvatura":"D","espessura":"0.07","mapping":"Fox Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false,"estilo":"Sofisticado"}'::jsonb,
      NOW() - INTERVAL '4 months');

  -- ======================================================================
  -- 8c. CLIENTES — EST3 (Gabriela Costa — Belo Horizonte)
  -- ======================================================================
  cl3_01:=gen_random_uuid(); cl3_02:=gen_random_uuid(); cl3_03:=gen_random_uuid();
  cl3_04:=gen_random_uuid(); cl3_05:=gen_random_uuid(); cl3_06:=gen_random_uuid();
  cl3_07:=gen_random_uuid(); cl3_08:=gen_random_uuid(); cl3_09:=gen_random_uuid();
  cl3_10:=gen_random_uuid();

  INSERT INTO public.clientes (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,alergias,anamnese_lash,created_at) VALUES
    (cl3_01,est3,'Aline','Pereira','aline.pereira@gmail.com','(31) 99111-2233','1994-05-20','Veio pelo Instagram.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '3 months'),
    (cl3_02,est3,'Tatiane','Oliveira','tatiane.oliveira@gmail.com','(31) 98222-3344','1991-10-08','Indicação da Aline.',NULL,'{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '2 months'),
    (cl3_03,est3,'Renata','Costa','renata.costa@hotmail.com','(31) 97333-4455','1987-03-12','Prefere tarde.',NULL,'{"curvatura":"CC","espessura":"0.07","mapping":"Volumoso","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '2 months'),
    (cl3_04,est3,'Simone','Ferreira','simone.ferreira@gmail.com','(31) 96444-5566','1980-07-18','Cliente da primeira hora.',NULL,'{"curvatura":"B","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '3 months'),
    (cl3_05,est3,'Débora','Alves','debora.alves@gmail.com','(31) 95555-6677','1999-12-25','Pede sempre Volume Russo.',NULL,'{"curvatura":"D","espessura":"0.10","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '6 weeks'),
    (cl3_06,est3,'Cristiane','Souza','cristiane.souza@icloud.com','(31) 94666-7788','1993-06-14','Trabalha como recepcionista.',NULL,'{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '7 weeks'),
    (cl3_07,est3,'Natália','Barbosa','natalia.barbosa@gmail.com','(31) 93777-8899','2000-04-02','Geração Z. Adora conteúdo de beleza.','Rinite — evitar produtos com cheiro forte','{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":false,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '5 weeks'),
    (cl3_08,est3,'Viviane','Rodrigues','viviane.rodrigues@gmail.com','(31) 92888-9900','1984-09-30','Médica. Muito ocupada, horários variados.',NULL,'{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '2 months'),
    (cl3_09,est3,'Márjorie','Santos','marjorie.santos@outlook.com','(31) 91999-0011','1996-01-17','Noiva para dezembro.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":false,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '4 weeks'),
    (cl3_10,est3,'Eliane','Dias','eliane.dias@gmail.com','(31) 90010-1122','1978-11-05','Já atendi a mãe e a filha dela.',NULL,'{"curvatura":"B","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '3 months');

  -- ======================================================================
  -- 8d. CLIENTES — EST4 (Fernanda Alves — Curitiba)
  -- ======================================================================
  cl4_01:=gen_random_uuid(); cl4_02:=gen_random_uuid(); cl4_03:=gen_random_uuid();
  cl4_04:=gen_random_uuid(); cl4_05:=gen_random_uuid(); cl4_06:=gen_random_uuid();
  cl4_07:=gen_random_uuid(); cl4_08:=gen_random_uuid(); cl4_09:=gen_random_uuid();
  cl4_10:=gen_random_uuid();

  INSERT INTO public.clientes (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,alergias,anamnese_lash,created_at) VALUES
    (cl4_01,est4,'Sabrina','Moreira','sabrina.moreira@gmail.com','(41) 99321-6540','1992-04-17','Cliente pontualíssima.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '7 months'),
    (cl4_02,est4,'Amanda','Lopes','amanda.lopes@hotmail.com','(41) 98432-7651','1997-08-23','Cabelereiro de vez em quando. Entende do ramo.',NULL,'{"curvatura":"CC","espessura":"0.07","mapping":"Volume","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '6 months'),
    (cl4_03,est4,'Jéssica','Freitas','jessica.freitas@gmail.com','(41) 97543-8762','2001-02-14','Ama cílios bem curvados.',NULL,'{"curvatura":"D","espessura":"0.10","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '5 months'),
    (cl4_04,est4,'Karoline','Nascimento','karoline.nascimento@gmail.com','(41) 96654-9873','1989-06-30','Enfermeira, horários variados.',NULL,'{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '4 months'),
    (cl4_05,est4,'Luciana','Peixoto','luciana.peixoto@icloud.com','(41) 95765-0984','1986-10-11','Executiva. Cílios para reuniões.',NULL,'{"curvatura":"B","espessura":"0.07","mapping":"Discreto","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '4 months'),
    (cl4_06,est4,'Marina','Cunha','marina.cunha@gmail.com','(41) 94876-1095','2000-01-28','Blogueira de moda.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Fox Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '3 months'),
    (cl4_07,est4,'Érica','Teixeira','erica.teixeira@yahoo.com.br','(41) 93987-2106','1994-07-19','Atividade física intensa. Orientada.',NULL,'{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '2 months'),
    (cl4_08,est4,'Raquel','Monteiro','raquel.monteiro@gmail.com','(41) 92098-3217','1990-03-05','Retornando após licença maternidade.',NULL,'{"curvatura":"CC","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '6 weeks'),
    (cl4_09,est4,'Suelen','Barbosa','suelen.barbosa@gmail.com','(41) 91109-4328','2003-09-22','Primeira vez. Veio do TikTok.',NULL,'{"curvatura":"C","espessura":"0.05","mapping":"Efeito Natural","fez_extensao_antes":false,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '4 weeks'),
    (cl4_10,est4,'Tatiana','Reis','tatiana.reis@outlook.com','(41) 90210-5439','1981-12-15','Dentista. Agenda no intervalo do almoço.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '5 months');

  -- ======================================================================
  -- 8e. CLIENTES — EST5 (Camila Rodrigues — Brasília)
  -- ======================================================================
  cl5_01:=gen_random_uuid(); cl5_02:=gen_random_uuid(); cl5_03:=gen_random_uuid();
  cl5_04:=gen_random_uuid(); cl5_05:=gen_random_uuid(); cl5_06:=gen_random_uuid();
  cl5_07:=gen_random_uuid(); cl5_08:=gen_random_uuid(); cl5_09:=gen_random_uuid();
  cl5_10:=gen_random_uuid();

  INSERT INTO public.clientes (id,estabelecimento_id,nome,sobrenome,email,whatsapp,data_nascimento,observacoes,alergias,anamnese_lash,created_at) VALUES
    (cl5_01,est5,'Alessandra','Figueiredo','alessandra.fig@gmail.com','(61) 99456-7801','1988-02-14','Servidora federal. Cílios para eventos oficiais.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Sofisticado","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '1 week'),
    (cl5_02,est5,'Beatriz','Meireles','beatriz.meireles@gov.br','(61) 98567-8912','1985-06-30','Assessora parlamentar.',NULL,'{"curvatura":"CC","espessura":"0.07","mapping":"Volume","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '1 week'),
    (cl5_03,est5,'Carla','Drummond','carla.drummond@gmail.com','(61) 97678-9023','1991-11-08','Arquiteta. Estética é tudo.',NULL,'{"curvatura":"D","espessura":"0.10","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '1 week'),
    (cl5_04,est5,'Diana','Macedo','diana.macedo@outlook.com','(61) 96789-0134','1995-04-25','Influenciadora com 80k seguidores.',NULL,'{"curvatura":"L","espessura":"0.07","mapping":"Mega Volume","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '1 week'),
    (cl5_05,est5,'Elisa','Negrão','elisa.negrao@gmail.com','(61) 95890-1245','1993-08-17','Empresária. Viaja muito.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '5 days'),
    (cl5_06,est5,'Flora','Barreto','flora.barreto@gmail.com','(61) 94901-2356','1990-01-03','Atriz. Participa de peças locais.',NULL,'{"curvatura":"D","espessura":"0.10","mapping":"Dramático","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '5 days'),
    (cl5_07,est5,'Gabriella','Pinheiro','gabriella.pinheiro@icloud.com','(61) 93012-3467','1998-05-11','Personal trainer.',NULL,'{"curvatura":"C","espessura":"0.07","mapping":"Efeito Natural","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '4 days'),
    (cl5_08,est5,'Helena','Azevedo','helena.azevedo@gmail.com','(61) 92123-4578','1987-09-20','Médica especialista.',NULL,'{"curvatura":"B","espessura":"0.05","mapping":"Discreto","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '4 days'),
    (cl5_09,est5,'Isadora','Queiroz','isadora.queiroz@gmail.com','(61) 91234-5689','2000-07-14','Recém formada em Direito.',NULL,'{"curvatura":"C","espessura":"0.07","mapping":"Cat Eye","fez_extensao_antes":false,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '3 days'),
    (cl5_10,est5,'Juliana','Tavares','juliana.tavares@hotmail.com','(61) 90345-6790','1983-12-28','Sócia de escritório de contabilidade.',NULL,'{"curvatura":"D","espessura":"0.07","mapping":"Sofisticado","fez_extensao_antes":true,"reacao_alergica_anterior":false}'::jsonb, NOW() - INTERVAL '3 days');

  -- ======================================================================
  -- 9. AGENDAMENTOS — EST1 (Mariana Lima)
  -- ======================================================================
  -- Futuros
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_01, (CURRENT_DATE + 1)::timestamp + TIME '09:00',150,'confirmado','portal',200.00,'Volume Russo — curvatura D, 0.07');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_vr,200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_04, (CURRENT_DATE + 1)::timestamp + TIME '11:00',150,'confirmado','portal',200.00,'Volume Russo para ensaio fotográfico');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_vr,200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_06, (CURRENT_DATE + 2)::timestamp + TIME '09:00', 90,'confirmado','portal',100.00,'Manutenção fio a fio');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_man,100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_02, (CURRENT_DATE + 3)::timestamp + TIME '09:00',120,'pendente','portal',150.00,'Fio a Fio — retoque');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_fio,150.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_07, (CURRENT_DATE + 5)::timestamp + TIME '10:00',120,'pendente','portal',160.00,'Primeira extensão — Volume Brasileiro');
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_vb,160.00);

  -- Passados concluídos
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est1,cl1_03, (CURRENT_DATE - 2)::timestamp + TIME '10:00',135,'concluido','portal',180.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_vh,180.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est1,cl1_05, (CURRENT_DATE - 3)::timestamp + TIME '09:00', 60,'concluido','admin',120.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_lft,120.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est1,cl1_08, (CURRENT_DATE - 5)::timestamp + TIME '14:00',150,'concluido','portal',200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_vr,200.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est1,cl1_09, (CURRENT_DATE - 7)::timestamp + TIME '11:00', 90,'concluido','portal',100.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_man,100.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est1,cl1_01, (CURRENT_DATE - 8)::timestamp + TIME '09:00',150,'concluido','portal',200.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s1_vr,200.00);

  -- Falta e cancelado
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_10, (CURRENT_DATE - 4)::timestamp + TIME '10:00',120,'falta','portal',150.00,'Não compareceu e não avisou');

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est1,cl1_02, (CURRENT_DATE - 6)::timestamp + TIME '14:00', 60,'cancelado','portal',120.00,'Cancelou com 2h de antecedência');

  -- ======================================================================
  -- 9b. AGENDAMENTOS — EST2 (Beatriz Oliveira)
  -- ======================================================================
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_01,(CURRENT_DATE + 1)::timestamp + TIME '10:00',150,'confirmado','portal',190.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_vr,190.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_03,(CURRENT_DATE + 2)::timestamp + TIME '11:00',120,'confirmado','portal',140.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_fio,140.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_07,(CURRENT_DATE + 4)::timestamp + TIME '14:00',135,'pendente','portal',170.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_vh,170.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_02,(CURRENT_DATE - 1)::timestamp + TIME '10:00',150,'concluido','portal',190.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_vr,190.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_05,(CURRENT_DATE - 3)::timestamp + TIME '15:00', 90,'concluido','portal',95.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_man,95.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_06,(CURRENT_DATE - 5)::timestamp + TIME '11:00',135,'concluido','portal',170.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_vh,170.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est2,cl2_04,(CURRENT_DATE - 6)::timestamp + TIME '10:00', 60,'concluido','admin',110.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s2_lft,110.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est2,cl2_09,(CURRENT_DATE - 4)::timestamp + TIME '14:00',120,'falta','portal',140.00,'No-show sem aviso');

  -- ======================================================================
  -- 9c. AGENDAMENTOS — EST4 (Fernanda Alves)
  -- ======================================================================
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est4,cl4_01,(CURRENT_DATE + 1)::timestamp + TIME '08:00',150,'confirmado','portal',210.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s4_vr,210.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est4,cl4_04,(CURRENT_DATE + 1)::timestamp + TIME '10:30',135,'confirmado','portal',185.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s4_vh,185.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est4,cl4_06,(CURRENT_DATE + 3)::timestamp + TIME '14:00',120,'pendente','portal',155.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s4_fio,155.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est4,cl4_02,(CURRENT_DATE - 2)::timestamp + TIME '09:00',150,'concluido','portal',210.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s4_vr,210.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est4,cl4_08,(CURRENT_DATE - 4)::timestamp + TIME '08:00',120,'concluido','portal',155.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s4_fio,155.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est4,cl4_10,(CURRENT_DATE - 6)::timestamp + TIME '11:00',150,'concluido','admin',210.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s4_vr,210.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est4,cl4_09,(CURRENT_DATE - 3)::timestamp + TIME '14:00',120,'falta','portal',155.00,'Primeira vez — não compareceu');

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado,observacoes) VALUES
    (ag,est4,cl4_05,(CURRENT_DATE - 7)::timestamp + TIME '11:00',135,'cancelado','portal',185.00,'Viagem de última hora');

  -- ======================================================================
  -- 9d. AGENDAMENTOS — EST5 (Camila Rodrigues)
  -- ======================================================================
  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est5,cl5_01,(CURRENT_DATE + 1)::timestamp + TIME '10:00',150,'confirmado','portal',260.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s5_vr,260.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est5,cl5_04,(CURRENT_DATE + 2)::timestamp + TIME '14:00',150,'pendente','portal',260.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s5_vr,260.00);

  ag := gen_random_uuid();
  INSERT INTO public.agendamentos (id,estabelecimento_id,cliente_id,data_hora,duracao_minutos,status,origem,valor_cobrado) VALUES
    (ag,est5,cl5_06,(CURRENT_DATE + 4)::timestamp + TIME '10:00',135,'pendente','portal',230.00);
  INSERT INTO public.agendamento_servicos (agendamento_id,servico_id,valor_cobrado) VALUES (ag,s5_vh,230.00);

  -- ======================================================================
  -- 10. ATENDIMENTOS MANUAIS (histórico financeiro — últimos 3 meses)
  -- ======================================================================

  -- EST1 — Mariana Lima (produção alta, dashboard rico)
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est1,cl1_02,s1_vr,  CURRENT_DATE - 35, 200.00,'Volume Russo completo'),
    (est1,cl1_03,s1_vh,  CURRENT_DATE - 32, 180.00,'Vol. Híbrido — ótimo resultado'),
    (est1,cl1_01,s1_vr,  CURRENT_DATE - 29, 200.00,'Renovação Volume Russo'),
    (est1,cl1_04,s1_vr,  CURRENT_DATE - 27, 200.00,'Para ensaio'),
    (est1,cl1_06,s1_man, CURRENT_DATE - 25, 100.00,'Manutenção fio a fio'),
    (est1,cl1_08,s1_fio, CURRENT_DATE - 22, 150.00,'Primeiro atendimento — fio a fio'),
    (est1,cl1_09,s1_man, CURRENT_DATE - 21, 100.00,'Manutenção — curvatura D mantida'),
    (est1,cl1_07,s1_vb,  CURRENT_DATE - 19, 160.00,'Volume Brasileiro — adorou'),
    (est1,cl1_05,s1_lft, CURRENT_DATE - 18, 120.00,'Lash Lifting — pré-noivado'),
    (est1,cl1_02,s1_vr,  CURRENT_DATE - 14, 200.00,'Manutenção Vol. Russo'),
    (est1,cl1_01,s1_man, CURRENT_DATE - 12, 100.00,'Manutenção'),
    (est1,cl1_04,s1_vr,  CURRENT_DATE - 10, 200.00,'Volume Russo'),
    (est1,cl1_03,s1_man, CURRENT_DATE -  9, 100.00,'Manutenção vol. híbrido'),
    (est1,cl1_08,s1_vr,  CURRENT_DATE -  7, 200.00,'Migrou para Volume Russo'),
    (est1,cl1_09,s1_man, CURRENT_DATE -  6, 100.00,'Manutenção mensal'),
    (est1,cl1_06,s1_sob, CURRENT_DATE -  5,  50.00,'Design sobrancelhas'),
    (est1,cl1_02,s1_spa, CURRENT_DATE -  3,  50.00,'Spa de cílios pré-manutenção');

  -- EST2 — Beatriz Oliveira
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est2,cl2_02,s2_vr,  CURRENT_DATE - 40, 190.00,'VIP — Volume Russo completo'),
    (est2,cl2_04,s2_fio, CURRENT_DATE - 38, 140.00,'Fio a fio clássico'),
    (est2,cl2_01,s2_vh,  CURRENT_DATE - 35, 170.00,'Híbrido a pedido dela'),
    (est2,cl2_05,s2_man, CURRENT_DATE - 30, 95.00, 'Manutenção Vol. Russo'),
    (est2,cl2_06,s2_vr,  CURRENT_DATE - 27, 190.00,'Volume Russo'),
    (est2,cl2_08,s2_fio, CURRENT_DATE - 25, 140.00,'Fio a fio'),
    (est2,cl2_02,s2_man, CURRENT_DATE - 22, 95.00, 'Manutenção'),
    (est2,cl2_10,s2_vh,  CURRENT_DATE - 20, 170.00,'Híbrido premium'),
    (est2,cl2_01,s2_vr,  CURRENT_DATE - 16, 190.00,'Vol. Russo renovação'),
    (est2,cl2_04,s2_lft, CURRENT_DATE - 14, 110.00,'Lash Lifting — mudou de serviço'),
    (est2,cl2_07,s2_vr,  CURRENT_DATE - 12, 190.00,'Para trabalho de modelo'),
    (est2,cl2_06,s2_man, CURRENT_DATE -  9,  95.00,'Manutenção'),
    (est2,cl2_08,s2_man, CURRENT_DATE -  7,  95.00,'Manutenção fio a fio');

  -- EST3 — Gabriela Costa (plano básico — só atendimentos manuais)
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est3,cl3_01,s3_vr,  CURRENT_DATE - 50, 175.00,'Volume Russo'),
    (est3,cl3_02,s3_fio, CURRENT_DATE - 45, 130.00,'Fio a fio'),
    (est3,cl3_03,s3_vr,  CURRENT_DATE - 40, 175.00,'Vol. Russo — cliente nova'),
    (est3,cl3_05,s3_vr,  CURRENT_DATE - 38, 175.00,'Volume Russo'),
    (est3,cl3_01,s3_man, CURRENT_DATE - 35,  90.00,'Manutenção'),
    (est3,cl3_04,s3_sob, CURRENT_DATE - 32,  45.00,'Design sobrancelha'),
    (est3,cl3_06,s3_fio, CURRENT_DATE - 28, 130.00,'Fio a fio'),
    (est3,cl3_02,s3_man, CURRENT_DATE - 25,  90.00,'Manutenção fio a fio'),
    (est3,cl3_08,s3_lft, CURRENT_DATE - 22, 100.00,'Lash Lifting'),
    (est3,cl3_05,s3_man, CURRENT_DATE - 20,  90.00,'Manutenção Vol. Russo'),
    (est3,cl3_03,s3_man, CURRENT_DATE - 18,  90.00,'Manutenção'),
    (est3,cl3_09,s3_fio, CURRENT_DATE - 15, 130.00,'Primeira extensão — noiva'),
    (est3,cl3_07,s3_vr,  CURRENT_DATE - 12, 175.00,'Vol. Russo — Instagram pediu'),
    (est3,cl3_01,s3_man, CURRENT_DATE -  8,  90.00,'Manutenção mensal'),
    (est3,cl3_10,s3_hen, CURRENT_DATE -  6,  65.00,'Design com henna'),
    (est3,cl3_06,s3_man, CURRENT_DATE -  4,  90.00,'Manutenção'),
    (est3,cl3_08,s3_sob, CURRENT_DATE -  2,  45.00,'Sobrancelha');

  -- EST4 — Fernanda Alves (ticket médio-alto)
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est4,cl4_01,s4_vr,  CURRENT_DATE - 60, 210.00,'Volume Russo'),
    (est4,cl4_02,s4_vh,  CURRENT_DATE - 55, 185.00,'Híbrido'),
    (est4,cl4_03,s4_vr,  CURRENT_DATE - 50, 210.00,'Vol. Russo — adorou'),
    (est4,cl4_01,s4_man, CURRENT_DATE - 45, 105.00,'Manutenção Vol. Russo'),
    (est4,cl4_05,s4_fio, CURRENT_DATE - 42, 155.00,'Fio a fio para trabalho'),
    (est4,cl4_10,s4_vr,  CURRENT_DATE - 38, 210.00,'Vol. Russo'),
    (est4,cl4_02,s4_man, CURRENT_DATE - 35, 105.00,'Manutenção'),
    (est4,cl4_07,s4_lft, CURRENT_DATE - 32, 115.00,'Lash Lifting — primeira vez'),
    (est4,cl4_03,s4_man, CURRENT_DATE - 30, 105.00,'Manutenção'),
    (est4,cl4_04,s4_vh,  CURRENT_DATE - 28, 185.00,'Volume Híbrido'),
    (est4,cl4_01,s4_vr,  CURRENT_DATE - 22, 210.00,'Renovação Vol. Russo'),
    (est4,cl4_06,s4_fio, CURRENT_DATE - 20, 155.00,'Fio a fio para conteúdo'),
    (est4,cl4_10,s4_man, CURRENT_DATE - 18, 105.00,'Manutenção'),
    (est4,cl4_02,s4_vr,  CURRENT_DATE - 15, 210.00,'Vol. Russo completo'),
    (est4,cl4_07,s4_man, CURRENT_DATE - 12, 105.00,'Manutenção lash lifting'),
    (est4,cl4_03,s4_vr,  CURRENT_DATE -  9, 210.00,'Renovação'),
    (est4,cl4_05,s4_sob, CURRENT_DATE -  7,  55.00,'Design sobrancelha'),
    (est4,cl4_01,s4_man, CURRENT_DATE -  4, 105.00,'Manutenção mensal');

  -- EST5 — Camila Rodrigues (premium, ticket alto, conta nova — dados recentes)
  INSERT INTO public.atendimentos (estabelecimento_id,cliente_id,servico_id,data_atendimento,valor_cobrado,observacoes) VALUES
    (est5,cl5_02,s5_vr,  CURRENT_DATE - 6, 260.00,'Volume Russo Premium — primeira vez'),
    (est5,cl5_03,s5_vh,  CURRENT_DATE - 5, 230.00,'Volume Híbrido — cliente nova'),
    (est5,cl5_08,s5_fio, CURRENT_DATE - 4, 190.00,'Fio a fio clássico'),
    (est5,cl5_10,s5_vr,  CURRENT_DATE - 3, 260.00,'Volume Russo — indicação'),
    (est5,cl5_07,s5_lft, CURRENT_DATE - 2, 150.00,'Lash Lifting — personal trainer');

END;
$$;
