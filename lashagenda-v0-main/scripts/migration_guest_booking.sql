-- =========================================================================
-- MIGRATION — Suporte a agendamento como convidada (login anônimo)
-- =========================================================================
-- Objetivo: permitir que uma cliente agende pelo portal informando apenas
-- Nome e WhatsApp, sem precisar criar conta com e-mail/senha.
--
-- Como funciona: o app usa supabase.auth.signInAnonymously() para criar uma
-- sessão real (auth.uid() existe), reaproveitando 100% das RLS policies e do
-- fluxo de agendamento já existentes — nenhuma policy nova é necessária.
--
-- Único ajuste necessário no banco: contas anônimas não têm e-mail
-- (auth.users.email = NULL), mas public.usuarios.email é UNIQUE NOT NULL.
-- Esta migration troca o e-mail real por um e-mail sintético único somente
-- quando o e-mail estiver ausente — contas com e-mail real (fluxo de
-- cadastro completo, sem alteração) continuam funcionando exatamente como
-- antes.
--
-- Pré-requisito: habilitar "Anonymous Sign-ins" em
-- Supabase Dashboard → Authentication → Sign In / Providers.
--
-- Seguro para rodar em produção: é um CREATE OR REPLACE FUNCTION, não altera
-- dados existentes nem estrutura de tabelas.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_est_id   UUID;
  negocio_nome TEXT;
  negocio_slug TEXT;
  user_role    TEXT;
  client_uuid  UUID;
  cat_ext_id   UUID;
  cat_lift_id  UUID;
  cat_des_id   UUID;
  cat_man_id   UUID;
  srv_man_id   UUID;
BEGIN
  -- Login com Google não fornece nome_negocio nem slug (só nome, e-mail e
  -- foto) — usa o nome da conta Google como nome provisório do negócio;
  -- a profissional pode renomear depois em Configurações.
  negocio_nome := COALESCE(
    new.raw_user_meta_data ->> 'nome_negocio',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    'Meu Estúdio'
  );
  negocio_slug := new.raw_user_meta_data ->> 'slug';
  user_role    := COALESCE(new.raw_user_meta_data ->> 'role', 'profissional');

  IF user_role = 'profissional' THEN

    -- 1. Criar o estabelecimento com trial de 7 dias no plano Agenda
    INSERT INTO public.estabelecimentos (nome_negocio, slug, plano, status_assinatura, trial_ends_at)
    VALUES (
      negocio_nome,
      COALESCE(negocio_slug, lower(regexp_replace(negocio_nome, '[^a-zA-Z0-9]', '-', 'g'))),
      'basico',
      'trial',
      now() + INTERVAL '7 days'
    )
    RETURNING id INTO new_est_id;

    -- 2. Criar registro do usuário profissional
    INSERT INTO public.usuarios (id, nome, email, role, estabelecimento_id)
    VALUES (new.id, negocio_nome, new.email, 'profissional', new_est_id);

    -- 3. Criar configurações padrão do negócio
    INSERT INTO public.configuracao_negocio (estabelecimento_id, nome_negocio)
    VALUES (new_est_id, negocio_nome);

    -- 4. Criar categorias de serviço padrão
    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Extensão de Cílios', 'Técnicas de alongamento de cílios fio a fio e volumes.', 1)
    RETURNING id INTO cat_ext_id;

    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Lash Lifting & Tratamentos', 'Curvatura e tratamentos para cílios naturais.', 2)
    RETURNING id INTO cat_lift_id;

    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Design de Sobrancelhas', 'Modelagem, alinhamento e coloração para sobrancelhas.', 3)
    RETURNING id INTO cat_des_id;

    INSERT INTO public.categorias_servico (estabelecimento_id, nome, descricao, ordem)
    VALUES (new_est_id, 'Manutenções e Remoções', 'Cuidados periódicos e remoção segura de extensões.', 4)
    RETURNING id INTO cat_man_id;

    -- 5. Criar serviços padrão — Extensão de Cílios
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, cat_ext_id, 'Fio a Fio Clássico', 'Um fio sintético acoplado a cada cílio natural. Efeito natural e discreto para o dia a dia.', 120, 150.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Fio%20a%20Fio%20Classico.png'),
      (new_est_id, cat_ext_id, 'Volume Russo', 'Fans artesanais de 3 a 6 fios super finos aplicados em cada cílio. Efeito volumoso, denso e marcante.', 150, 200.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Volume%20Russo.png'),
      (new_est_id, cat_ext_id, 'Volume Híbrido', 'Mescla perfeita de Fio a Fio com Volume Russo. Oferece volume com textura e leveza.', 135, 180.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Volume%20Hibrido.png'),
      (new_est_id, cat_ext_id, 'Volume Brasileiro (Cílios Y)', 'Extensões em formato de Y aplicadas individualmente. Proporciona olhar preenchido e moderno.', 120, 160.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Volume%20Brasileiro%20(Cilios%20Y).png');

    -- 5b. Serviços padrão — Lash Lifting & Tratamentos
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, cat_lift_id, 'Lash Lifting Completo', 'Curvatura natural e elevação dos cílios com aplicação de nutrição (Lash Botox) e tintura escura.', 60, 120.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Lash%20Lifting%20%20Completo.png'),
      (new_est_id, cat_lift_id, 'Spa de Cílios', 'Higienização profunda dos fios, hidratação terapêutica e massagem relaxante na área dos olhos.', 30, 50.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Spa%20de%20Cilios.png');

    -- 5c. Serviços padrão — Design de Sobrancelhas
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, cat_des_id, 'Design de Sobrancelhas Simples', 'Modelagem personalizada respeitando a simetria e visagismo facial. Feito com pinça/linha.', 45, 50.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Design%20de%20Sobrancelhas%20Simples.png'),
      (new_est_id, cat_des_id, 'Design com Henna', 'Modelagem personalizada com aplicação de Henna de alta fixação para preencher falhas e destacar o design.', 60, 70.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Design%20com%20Henna.png'),
      (new_est_id, cat_des_id, 'Brow Lamination', 'Procedimento de alinhamento, estilização e nutrição química dos fios naturais das sobrancelhas.', 60, 130.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Brow%20Lamination.png');

    -- 5d. Serviços padrão — Manutenções e Remoções
    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES (new_est_id, cat_man_id, 'Manutenção de Extensão', 'Reposição dos fios crescidos ou caídos. Válido até 20 dias após a aplicação original.', 90, 100.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Manutencao%20de%20Extensao.png')
    RETURNING id INTO srv_man_id;

    INSERT INTO public.servicos (estabelecimento_id, categoria_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES (new_est_id, cat_man_id, 'Remoção de Extensão', 'Retirada segura e indolor de extensões antigas usando removedor em gel profissional.', 45, 40.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Remocao%20de%20Extensao.png');

    -- 6. Variações da Manutenção de Extensão
    INSERT INTO public.variacoes_servico (servico_id, nome, duracao_minutos, valor)
    VALUES
      (srv_man_id, 'Manutenção Fio a Fio',          90,  90.00),
      (srv_man_id, 'Manutenção Volume Brasileiro',   90, 100.00),
      (srv_man_id, 'Manutenção Volume Híbrido',     100, 110.00),
      (srv_man_id, 'Manutenção Volume Russo',        120, 120.00);

    -- 7. Criar horários de atendimento padrão (Seg–Sex, 09:00–18:00)
    -- ON CONFLICT DO NOTHING garante idempotência caso o frontend também execute o seed
    INSERT INTO public.horarios_atendimento (estabelecimento_id, dia_semana, hora_inicio, hora_fim)
    VALUES
      (new_est_id, 1, '09:00', '18:00'),
      (new_est_id, 2, '09:00', '18:00'),
      (new_est_id, 3, '09:00', '18:00'),
      (new_est_id, 4, '09:00', '18:00'),
      (new_est_id, 5, '09:00', '18:00')
    ON CONFLICT (estabelecimento_id, dia_semana) DO NOTHING;

  ELSIF user_role = 'cliente' THEN

    client_uuid := (new.raw_user_meta_data ->> 'cliente_id')::UUID;

    -- Criar registro do usuário cliente (vinculado ao cliente já existente).
    -- Contas anônimas (agendamento como convidada) não têm e-mail — geramos
    -- um e-mail sintético único para satisfazer a constraint UNIQUE NOT NULL
    -- sem precisar alterar o schema da tabela usuarios.
    INSERT INTO public.usuarios (id, nome, email, role, cliente_id, estabelecimento_id)
    VALUES (
      new.id,
      new.raw_user_meta_data ->> 'nome',
      COALESCE(new.email, 'guest_' || new.id::text || '@guests.lashagenda.internal'),
      'cliente',
      client_uuid,
      (new.raw_user_meta_data ->> 'estabelecimento_id')::UUID
    );

  END IF;

  RETURN NEW;
END;
$$;
