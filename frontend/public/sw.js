// AI Festivals Platform — Service Worker
// Handles push notifications from /api/notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'AI Festivals', body: event.data.text() };
  }

  const { title = 'AI Festivals', body = '', icon = '/favicon.ico', url = '/' } = data;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: '/favicon.ico',
      data: { url },
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});
