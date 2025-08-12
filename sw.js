// sw.js
const CACHE = 'sl-cache-v3';
const CORE = ['.', './index.html', './manifest.json', './icon.ico'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Cache-first for same-origin GET
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method === 'GET' && url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then(res =>
        res ||
        fetch(event.request).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
          return resp;
        }).catch(() => caches.match('./index.html'))
      )
    );
  }
});

/* ---------------- Firebase Messaging (background) ---------------- */
try {
  importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');

  // IMPORTANT: This config must match the one in index.html
  const firebaseConfig = {
    apiKey: "AIzaSyA9hxbbdjf6jMAch-PCWVkvAVN3p_Olei8",
    authDomain: "solo-leveling-78bd9.firebaseapp.com",
    projectId: "solo-leveling-78bd9",
    storageBucket: "solo-leveling-78bd9.firebasestorage.app",
    messagingSenderId: "786125061097",
    appId: "1:786125061097:web:9d2ebde1106e4bb4bd6978",
    measurementId: "G-TXRJENRYX9"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // When a push arrives while the app is closed or in background
  messaging.onBackgroundMessage(payload => {
    const title = payload.notification?.title || 'Solo Leveling';
    const body = payload.notification?.body || 'New update';
    const icon = '/icon.ico';
    const data = payload.data || {};
    self.registration.showNotification(title, { body, icon, data });
  });
} catch (e) {
  // If Firebase scripts fail to load, just skip messaging
  console.warn('Firebase Messaging not initialized in SW:', e);
}
