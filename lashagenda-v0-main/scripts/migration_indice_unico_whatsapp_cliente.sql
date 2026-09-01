-- =========================================================================
-- MIGRATION — Índice único de WhatsApp por estabelecimento em clientes
-- =========================================================================
-- Problema: confirmarComoConvidado (PortalAgendar.tsx) faz um check-then-insert
-- em clientes (busca por WhatsApp, se não achar, cria) sem nenhuma trava no
-- banco. Duas abas/dispositivos batendo ao mesmo tempo (ex: duplo toque, duas
-- abas abertas) podem ambos não encontrar a cliente e ambos criar um cadastro
-- novo — recriando o mesmo tipo de duplicidade já corrigido em
-- migration_fix_dedup_cliente_convidada.sql, só que por corrida em vez de
-- lógica de match.
--
-- Solução: índice único por WhatsApp normalizado (só dígitos) dentro de cada
-- estabelecimento. A segunda inserção concorrente falha com erro de
-- violação (23505) em vez de criar a duplicata — o código já foi ajustado
-- pra tratar esse erro específico e reaproveitar quem ganhou a corrida, sem
-- falhar o agendamento de quem perdeu.
--
-- Seguro para rodar em produção: CREATE UNIQUE INDEX IF NOT EXISTS não altera
-- dados existentes. Só falha se já existirem duplicatas reais na base — nesse
-- caso, resolva as duplicatas antes de rodar (não deveria haver nenhuma, já
-- que a lógica de match evita isso desde a migration anterior).
-- =========================================================================

CREATE UNIQUE INDEX IF NOT EXISTS clientes_estabelecimento_whatsapp_digits_key
ON public.clientes (estabelecimento_id, regexp_replace(whatsapp, '[^0-9]', '', 'g'))
WHERE whatsapp IS NOT NULL;
