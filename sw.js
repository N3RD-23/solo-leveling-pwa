/* sw.js — v4 */
const VERSION = 'v4';
const CACHE = `sl-cache-${VERSION}`;
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon.ico'
];

/* Install: precache core and activate immediately */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

/* Activate: clean old caches and take control */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* Fetch: cache-first for same-origin GET, SPA fallback for navigations */
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin GET
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // SPA navigation fallback
  const isNav = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (isNav) {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return resp;
      })
    )
  );
});

/* Allow page to trigger SW update without reload (optional) */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ------------ Optional: Firebase Cloud Messaging (background) ------------
   Fill firebaseConfig below to enable push notifications in background.
   If left as "YOUR_*", this block will be skipped gracefully.
---------------------------------------------------------------------------- */
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

  // Only init if user replaced placeholders
  if (!Object.values(firebaseConfig).some(v => String(v).startsWith('YOUR_'))) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(payload => {
      const title = payload.notification?.title || 'Solo Leveling';
      const body = payload.notification?.body || '';
      const icon = '/icon.ico';
      const data = payload.data || {};
      self.registration.showNotification(title, { body, icon, data });
    });
  } else {
    // console.info('FCM not configured in sw.js — skipping background messaging');
  }
} catch (e) {
  // console.warn('Firebase scripts not loaded in SW:', e);
}
