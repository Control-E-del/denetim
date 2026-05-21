// EduControl Service Worker v1.0
var CACHE_NAME = 'educontrol-v1';
var urlsToCache = [
  '/denetim/',
  '/denetim/index.html'
];

// Kurulum - dosyaları önbelleğe al
self.addEventListener('install', function(event) {
  console.log('[SW] Kuruluyor...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Aktivasyon - eski önbellekleri sil
self.addEventListener('activate', function(event) {
  console.log('[SW] Aktifleşti');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - önbellekten sun, yoksa internetten al
self.addEventListener('fetch', function(event) {
  // Google Fonts ve Apps Script isteklerini geçir
  if (event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic') ||
      event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      if (response) return response;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(function() {
        // Offline - önbellekten index.html sun
        return caches.match('/denetim/index.html');
      });
    })
  );
});

// PUSH BİLDİRİM - Android'de sayfa kapalıyken gelir
self.addEventListener('push', function(event) {
  console.log('[SW] Push bildirimi alındı');
  
  var data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = { title: 'EduControl', body: event.data.text() };
    }
  }

  var title = data.title || 'EduControl';
  var options = {
    body: data.body || 'Yeni bildirim',
    icon: 'https://control-e-del.github.io/denetim/logo3.png',
    badge: 'https://control-e-del.github.io/denetim/logo3.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'educontrol',
    requireInteraction: data.requireInteraction || false,
    data: {
      url: data.url || '/denetim/'
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Bildirime tıklanınca uygulamayı aç
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  var url = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/denetim/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Zaten açık pencere varsa focus yap
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes('/denetim') && 'focus' in client) {
          return client.focus();
        }
      }
      // Yoksa yeni sekme aç
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Arka plan senkronizasyon (isteğe bağlı)
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('[SW] Arka plan senkronizasyon');
  }
});
