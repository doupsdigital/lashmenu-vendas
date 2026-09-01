import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const CHAT_ID   = Deno.env.get('TELEGRAM_OWNER_CHAT_ID')!;
const SUPA_URL  = Deno.env.get('SUPABASE_URL')!;
const SUPA_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const payload = await req.json();
  const record  = payload?.record;

  if (!record || record.role !== 'profissional') {
    return new Response('OK', { status: 200 });
  }

  // Aguarda 2s para garantir que updates pós-insert (ex: telefone) sejam concluídos
  await new Promise(resolve => setTimeout(resolve, 2000));

  const supabase = createClient(SUPA_URL, SUPA_KEY);

  const [{ data: usuario }, { data: estudio }] = await Promise.all([
    supabase
      .from('usuarios')
      .select('nome, email, telefone')
      .eq('id', record.id)
      .single(),
    supabase
      .from('estabelecimentos')
      .select('nome_negocio, slug')
      .eq('id', record.estabelecimento_id)
      .single(),
  ]);

  const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const texto = [
    '🎉 *Nova profissional cadastrada!*',
    '',
    `👤 ${usuario?.nome || record.nome}`,
    `📧 ${usuario?.email || record.email}`,
    `📱 ${usuario?.telefone || 'Não informado'}`,
    `🏠 ${estudio?.nome_negocio || 'Sem nome'}`,
    `🔗 /portal/${estudio?.slug || ''}`,
    `🕐 ${agora}`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text: texto, parse_mode: 'Markdown' }),
  });

  return new Response('OK', { status: 200 });
});
