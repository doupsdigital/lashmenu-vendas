-- =========================================================================
-- MIGRATION — Evento server-side `agendamento_criado` no PostHog
-- =========================================================================
-- Contexto: o agendamento pode ser criado pela cliente final no Portal
-- (/portal/...), num navegador sem sessão logada da profissional — se
-- dependêssemos só do posthog-js do navegador da profissional, esse evento
-- nunca dispararia quando a origem é o Portal. Por isso ele é disparado
-- direto do banco, via trigger + pg_net, reaproveitando o mesmo padrão já
-- usado para o push notification (ver "6. WEB PUSH NOTIFICATIONS" em
-- scripts/schema_definitivo.sql).
--
-- distinct_id usado é o estabelecimento_id (a conta/negócio), nunca dado da
-- cliente final — ver docs/plano_analytics_funil_uso.md, Fase 5 (privacidade).
--
-- Seguro para rodar em produção: só cria função + trigger novos, não altera
-- dados existentes nem colunas de tabelas.
-- =========================================================================

-- pg_net já está habilitado neste projeto (usado pelo push notification),
-- mas mantemos o IF NOT EXISTS para o caso de rodar num projeto novo.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_posthog_agendamento()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://us.i.posthog.com/capture/',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'api_key', 'phc_quN9tH5AsE9pdF9WqMTYa9rxvrytiUC7oFtBsy9YSgX9',
      'event', 'agendamento_criado',
      'distinct_id', NEW.estabelecimento_id::text,
      'properties', jsonb_build_object(
        'origem', NEW.origem,
        'agendamento_id', NEW.id,
        'valor_cobrado', NEW.valor_cobrado
      )
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_agendamento_insert_posthog ON public.agendamentos;

CREATE TRIGGER on_agendamento_insert_posthog
AFTER INSERT ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_posthog_agendamento();
