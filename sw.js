const APP_VERSION = '2.10.3';
const STATIC_CACHE = `tenant-management-static-${APP_VERSION}`;
const RUNTIME_CACHE = `tenant-management-runtime-${APP_VERSION}`;

const ASSETS_TO_PRECACHE = [
    '/',
    '/index.html',
    '/install.html',
    '/manifest.json',
    '/css/style.css',
    '/css/belding-theme.css',
    '/css/mobile-native.css',
    '/css/tiles-style.css',
    '/js/payment-sync.js',
    '/js/tenant-unified-ui.js',
    '/js/tenant-hub.js',
    '/js/app.js',
    '/js/payments-table.js',
    '/js/mobile.js',
    '/js/auth.js',
    '/js/config.js',
    '/js/supabase-client.js',
    '/js/tiles-app.js',
    '/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(async (cache) => {
            await Promise.allSettled(ASSETS_TO_PRECACHE.map((url) => cache.add(url)));
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((cacheName) => ![STATIC_CACHE, RUNTIME_CACHE].includes(cacheName))
                    .map((cacheName) => caches.delete(cacheName))
            )
        )
    );
    self.clients.claim();
});

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response && response.status === 200) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
        }
        return response;
    } catch (_error) {
        const cached = await caches.match(request);
        return cached || caches.match('/index.html');
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request)
        .then(async (response) => {
            if (response && response.status === 200) {
                const cache = await caches.open(RUNTIME_CACHE);
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request));
        return;
    }

    event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'התראה חדשה',
        icon: '/icon-512.png',
        vibrate: [200, 100, 200],
        dir: 'rtl',
        lang: 'he',
    };

    event.waitUntil(self.registration.showNotification('מערכת ניהול דיירים', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
