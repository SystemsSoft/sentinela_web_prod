// Service worker do Firebase Cloud Messaging: recebe o push "Modo Sentinela ativo" com o app
// fechado/em segundo plano, mostra a notificação e, no clique, abre o app já na tela ao vivo.
// O firebase_messaging registra este arquivo em /firebase-cloud-messaging-push-scope, então ele
// não conflita com o flutter_service_worker.js.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB9TVEFF_QjZ98EfJlqKTwMZTuN6-IFlz0',
  appId: '1:967493738606:web:4199f46de0906354d4c67f',
  messagingSenderId: '967493738606',
  projectId: 'sentinela-877d7',
  authDomain: 'sentinela-877d7.firebaseapp.com',
  storageBucket: 'sentinela-877d7.firebasestorage.app',
});

const messaging = firebase.messaging();

// O servidor envia só "data" (sem "notification"), então a notificação é montada aqui.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || 'Modo Sentinela ativo';
  return self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icons/Icon-192.png',
    badge: '/icons/Icon-192.png',
    // Uma notificação por dono: reativar o modo substitui a anterior em vez de empilhar.
    tag: data.ownerUid ? `sentinela-live-${data.ownerUid}` : 'sentinela-live',
    renotify: true,
    requireInteraction: true,
    data: { url: data.url || '/' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || '/', self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.focus();
        // O app já aberto recebe a mensagem e troca de tela sem recarregar.
        client.postMessage({ type: 'sentinela-open-live', url: target });
        return;
      }
    }
    await clients.openWindow(target);
  })());
});
