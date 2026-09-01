-- =========================================================================
-- MIGRATION — Eventos adicionais do PostHog (Fase 4.1 do plano de analytics)
-- =========================================================================
-- agendamento_cancelado: dispara quando um agendamento muda de status para
-- 'cancelado' — sinal de fricção/insatisfação.
--
-- assinatura_ativada / plano_upgrade: mesmo trigger em estabelecimentos,
-- dispara quando status_assinatura vira 'ativo' (trial → pago) ou quando o
-- plano vira 'premium' (upgrade). São dois eventos distintos porque
-- respondem perguntas diferentes (conversão vs. upsell), mesmo compartilhando
-- o gatilho, como já previsto no plano.
--
-- distinct_id sempre é o estabelecimento_id (a conta/negócio) — nunca dado
-- de cliente final, mesmo padrão da Fase 4.
--
-- Seguro para rodar em produção: só cria funções + triggers novos, não
-- altera dados existentes nem colunas de tabelas.
-- =========================================================================

-- ── agendamento_cancelado ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_posthog_agendamento_cancelado()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelado' AND OLD.status IS DISTINCT FROM 'cancelado' THEN
    PERFORM net.http_post(
      url     := 'https://us.i.posthog.com/capture/',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'api_key', 'phc_quN9tH5AsE9pdF9WqMTYa9rxvrytiUC7oFtBsy9YSgX9',
        'event', 'agendamento_cancelado',
        'distinct_id', NEW.estabelecimento_id::text,
        'properties', jsonb_build_object(
          'agendamento_id', NEW.id,
          'valor_cobrado', NEW.valor_cobrado
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_agendamento_update_posthog_cancelado ON public.agendamentos;

CREATE TRIGGER on_agendamento_update_posthog_cancelado
AFTER UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_posthog_agendamento_cancelado();

-- ── assinatura_ativada / plano_upgrade ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_posthog_estabelecimento_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status_assinatura = 'ativo' AND OLD.status_assinatura = 'trial' THEN
    PERFORM net.http_post(
      url     := 'https://us.i.posthog.com/capture/',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'api_key', 'phc_quN9tH5AsE9pdF9WqMTYa9rxvrytiUC7oFtBsy9YSgX9',
        'event', 'assinatura_ativada',
        'distinct_id', NEW.id::text,
        'properties', jsonb_build_object('plano', NEW.plano)
      )
    );
  END IF;

  IF NEW.plano = 'premium' AND OLD.plano = 'basico' THEN
    PERFORM net.http_post(
      url     := 'https://us.i.posthog.com/capture/',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body    := jsonb_build_object(
        'api_key', 'phc_quN9tH5AsE9pdF9WqMTYa9rxvrytiUC7oFtBsy9YSgX9',
        'event', 'plano_upgrade',
        'distinct_id', NEW.id::text,
        'properties', jsonb_build_object('status_assinatura', NEW.status_assinatura)
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_estabelecimento_update_posthog ON public.estabelecimentos;

CREATE TRIGGER on_estabelecimento_update_posthog
AFTER UPDATE ON public.estabelecimentos
FOR EACH ROW
EXECUTE FUNCTION public.notify_posthog_estabelecimento_update();
