export const config = {
  matcher: ['/', '/c/:path*', '/catalogo/:path*']
};

export default async function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  const isBot = /facebookexternalhit|WhatsApp|Facebot|Twitterbot|TelegramBot|LinkedInBot/i.test(ua);

  if (!isBot) {
    return; // Usuários comuns navegam normalmente sem nenhuma interferência
  }

  const host = request.headers.get('host') || '';
  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'lashmenu-vendas' && !parts[0].includes('localhost')) {
    const slug = parts[0].toLowerCase().trim();

    try {
      const SUPABASE_URL = 'https://wffhptpsafllsmcsoiih.supabase.co';
      const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmZmhwdHBzYWZsbHNtY3NvaWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODkyMTYsImV4cCI6MjEwMjg2NTIxNn0.nwpvIwl8V6_KGIp5e5oeraAcGyt3oo8Kdam2hp6ajSQ';

      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (res.ok) {
        const orders = await res.json();
        if (orders && orders.length > 0) {
          const order = orders[0];
          const designerName = (order.client_name || slug).trim();
          const heroPhrase = (order.hero_phrase || 'Catálogo Exclusivo de Cílios & Sobrancelhas').trim();
          const coverMedia = order.cover_media_url || 'https://lashmenu.com/modelos/mosaico-rose/assets/img/Hero.png';

          const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${designerName} — Catálogo Exclusivo | LashMenu</title>
  <meta name="description" content="${heroPhrase} · Valores, procedimentos e agendamento online.">
  <meta property="og:title" content="${designerName} — Catálogo Exclusivo">
  <meta property="og:description" content="${heroPhrase} · Valores, procedimentos e agendamento online.">
  <meta property="og:image" content="${coverMedia}">
  <meta property="og:image:secure_url" content="${coverMedia}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://${slug}.lashmenu.com">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${designerName} — Catálogo Exclusivo">
  <meta name="twitter:description" content="${heroPhrase} · Valores, procedimentos e agendamento online.">
  <meta name="twitter:image" content="${coverMedia}">
</head>
<body>
  <h1>${designerName} — Catálogo Exclusivo</h1>
  <p>${heroPhrase}</p>
</body>
</html>`;

          return new Response(html, {
            status: 200,
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'public, max-age=60, s-maxage=300'
            }
          });
        }
      }
    } catch (e) {
      // Em caso de falha, deixa passar normalmente
    }
  }
}
