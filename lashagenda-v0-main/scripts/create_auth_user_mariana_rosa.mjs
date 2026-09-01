// =========================================================================
// LASH AGENDA — CRIAÇÃO DA CONTA DE AUTH DA MARIANA ROSA (conta de vídeo/demo)
//
// Cria, via Supabase Admin API, a conta de autenticação (auth.users) da
// Mariana Rosa — usada para gravar vídeos de exemplo do sistema no plano
// Premium (fichas de anamnese, relatórios, e todos os recursos do Básico
// também). Não cria nada em public.usuarios — isso é feito pelo
// seed_mariana_rosa.sql, que busca o UUID desta conta pelo e-mail.
//
// Uso:
//   1. Adicione SUPABASE_SERVICE_ROLE_KEY ao .env (NUNCA commitar essa chave).
//      Pegue em: Supabase Dashboard > Project Settings > API > service_role.
//   2. node scripts/create_auth_user_mariana_rosa.mjs
//   3. Rode o seed_mariana_rosa.sql no SQL Editor do Supabase.
// =========================================================================

import { readFileSync, existsSync } from 'node:fs';

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv(new URL('../.env', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'LashHubDemo123!';

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Faltam variáveis de ambiente. Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.'
  );
  process.exit(1);
}

const email = 'mariana.rosa@gmail.com';

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    // Sem nome_negocio/role nos metadados — assim o trigger
    // handle_new_user_onboarding() não cria um estabelecimento duplicado.
  }),
});

const data = await res.json();

if (!res.ok) {
  if (data.msg?.toLowerCase().includes('already') || data.message?.toLowerCase().includes('already')) {
    console.log(`⏭  Mariana Rosa (${email}) já existe — pulando.`);
  } else {
    console.error(`✗ Falha ao criar Mariana Rosa (${email}):`, data.msg || data.message || res.statusText);
    process.exit(1);
  }
} else {
  console.log(`✓ Mariana Rosa — ${email} — id: ${data.id}`);
}

console.log(`\nSenha da conta: ${DEMO_PASSWORD}`);
console.log('Agora rode o seed_mariana_rosa.sql no SQL Editor do Supabase.');
