import { supabase } from '../lib/supabase';

let currentUsuarioNome = 'Usuário do Sistema';

export const setCurrentUsuarioNome = (nome: string) => {
  currentUsuarioNome = nome;
};

export const registrarLog = async (
  acao: 'criou' | 'editou' | 'excluiu',
  entidade: string,
  entidadeId: string,
  descricao: string
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('logs').insert({
      usuario_id: user?.id || null,
      acao,
      detalhes: { entidade, entidade_id: entidadeId, descricao, usuario_nome: currentUsuarioNome }
    });
  } catch (err) {
    console.error('Erro ao registrar log de atividade:', err);
  }
};

