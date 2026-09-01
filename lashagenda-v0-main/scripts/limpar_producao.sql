-- =========================================================================
-- SCRIPT DE LIMPEZA DO BANCO DE DADOS (PRODUÇÃO LIMPA)
-- =========================================================================
-- Use este script no SQL Editor do Supabase sempre que quiser limpar
-- o banco de dados (remover clientes de teste, agendamentos, etc.)
-- e deixar o sistema pronto para uso, mantendo o acesso do profissional.

-- 1. Desvincular todas as clientes das contas de usuários (para não violar a chave estrangeira)
UPDATE public.usuarios SET cliente_id = NULL;

-- 2. Limpar os dados transacionais
DELETE FROM public.agendamento_servicos;
DELETE FROM public.atendimentos;
DELETE FROM public.agendamentos;
DELETE FROM public.clientes;
DELETE FROM public.logs;

-- 3. Remover do banco de dados os usuários clientes que se cadastraram pelo portal,
-- mantendo apenas a conta do profissional (admin) ativa para login.
DELETE FROM public.usuarios WHERE role != 'profissional';

-- =========================================================================
-- BANCO DE DADOS RESETADO E PRONTO PARA O CLIENTE REAL!
-- =========================================================================
