// EduControl Service Worker v2.0 - Firebase FCM
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAhwuxl3fCGYXg2DUNUTJim02GaPkm5538",
  authDomain: "educontrol-doga.firebaseapp.com",
  projectId: "educontrol-doga",
  storageBucket: "educontrol-doga.firebasestorage.app",
  messagingSenderId: "31902771311",
  appId: "1:31902771311:web:fcf151e4dae4e898d8859a"
});

const messaging = firebase.messaging();

// Sayfa KAPALI iken arka planda gelen bildirimler
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Arka plan bildirimi:', payload);
  
  var title = payload.notification.title || 'EduControl';
  var options = {
    body: payload.notification.body || 'Yeni bildirim',
    icon: 'https://control-e-del.github.io/denetim/logo3.png',
    badge: 'https://control-e-del.github.io/denetim/logo3.png',
    vibrate: [200, 100, 200],
    data: payload.data || {},
    requireInteraction: true
  };

  self.registration.showNotification(title, options);
});

// Bildirme tıklanınca uygulamayı aç
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('/denetim') && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('https://control-e-del.github.io/denetim/');
      }
    })
  );
});

// Önbellek
var CACHE_NAME = 'educontrol-v2';
self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(['/denetim/', '/denetim/index.html']);
    })
  );
});

self.addEventListener('activate', function(event) {
  self.clients.claim();
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); }));
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('googleapis') || event.request.url.includes('gstatic')) return;
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).catch(function() {
        return caches.match('/denetim/index.html');
      });
    })
  );
});
