-- =========================================================================
-- MIGRATION — Suporte a login com Google (sem tela extra de onboarding)
-- =========================================================================
-- Contexto: login com Google não fornece nome_negocio nem slug (só nome,
-- e-mail e foto do perfil Google) — diferente do cadastro normal por
-- e-mail, onde a profissional digita esses dados no formulário.
--
-- Em vez de bloquear a criação da conta (o comportamento antigo exigia
-- negocio_nome IS NOT NULL) ou pedir uma tela extra depois do login, a
-- função agora usa o nome da conta Google (full_name/name) como nome
-- provisório do negócio. A profissional pode renomear a qualquer momento
-- em Configurações — o acesso ao painel é imediato, sem fricção extra.
--
-- Seguro para rodar em produção: CREATE OR REPLACE não afeta contas já
-- criadas, só o comportamento de cadastros novos a partir de agora.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  new_est_id   UUID;
  negocio_nome TEXT;
  negocio_slug TEXT;
  user_role    TEXT;
  client_uuid  UUID;
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

    -- 4. Criar os 2 serviços de exemplo (os mais pedidos) — só uma base
    -- inicial pra profissional já ter algo pronto pra editar ou apagar.
    -- Categorias de serviço não são mais usadas no sistema — categoria_id fica NULL.
    INSERT INTO public.servicos (estabelecimento_id, nome, descricao, duracao_minutos, valor, ativo, imagem_url)
    VALUES
      (new_est_id, 'Fio a Fio Clássico', 'Um fio sintético acoplado a cada cílio natural. Efeito natural e discreto para o dia a dia.', 120, 150.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Fio%20a%20Fio%20Classico.png'),
      (new_est_id, 'Volume Russo', 'Fans artesanais de 3 a 6 fios super finos aplicados em cada cílio. Efeito volumoso, denso e marcante.', 150, 200.00, true, 'https://vgolovxcrsxnpcecvoyi.supabase.co/storage/v1/object/public/servicos-imagens/defaults/Volume%20Russo.png');

    -- 5. Criar horários de atendimento padrão (Seg–Sex, 09:00–18:00)
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
$function$
