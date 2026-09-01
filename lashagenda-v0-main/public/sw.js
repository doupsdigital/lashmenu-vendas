// Service Worker — Lash Agenda
// Estratégia network-first + suporte a Web Push Notifications

const CACHE_NAME = 'lashhub-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Requests de navegação (carregamento de página HTML) são entregues ao browser
  // diretamente — sem interceptar. Caso contrário, se fetch() falhar e não
  // houver cache, event.respondWith(undefined) lança TypeError e a navegação
  // fica presa num "network error", causando o loop login → falha → login.
  if (event.request.mode === 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached ?? Response.error();
    })
  );
});

// ── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = { title: 'Lash Agenda', body: 'Nova notificação', url: '/' };
  try { data = { ...data, ...event.data.json() }; } catch (_) { /* ignora */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        return existing.navigate(url);
      }
      return clients.openWindow(url);
    })
  );
});
