/**
 * Service Worker - מערכת ניהול דיירים
 * מפתח: בועז סעדה
 * גרסה: 2.5.0.5
 * 
 * ⚠️ חשוב: Service Worker זה מטמן רק קבצי HTML/CSS/JS
 * הוא לא נוגע בנתוני המשתמש ב-LocalStorage!
 * כל הנתונים (דיירים, תשלומים) נשמרים ב-LocalStorage
 * ונשארים שם גם אחרי התקנה כ-PWA.
 */

const CACHE_NAME = 'tenant-management-v2.5.0.5';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/install.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/icon-512.png',
    '/icon-192.png'
];

// התקנת Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] התקנה מתבצעת...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] קבצים נשמרים במטמון');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((error) => {
                console.error('[SW] שגיאה בשמירת קבצים במטמון:', error);
            })
    );
    
    // אקטיבציה מיידית
    self.skipWaiting();
});

// אקטיבציה
self.addEventListener('activate', (event) => {
    console.log('[SW] אקטיבציה מתבצעת...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] מוחק מטמון ישן:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // התחבר לכל הלקוחות
    return self.clients.claim();
});

// טיפול בבקשות
self.addEventListener('fetch', (event) => {
    // דלג על בקשות שאינן GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // דלג על בקשות חיצוניות (CDN, API)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // אם יש במטמון, החזר אותו
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // אחרת, שלוף מהרשת
                return fetch(event.request)
                    .then((response) => {
                        // בדוק שהתגובה תקינה
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // שמור עותק במטמון
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] שגיאה בשליפה מהרשת:', error);
                        
                        // אם זה HTML, החזר את index.html מהמטמון
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// הודעות push (לעתיד)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'התראה חדשה',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        vibrate: [200, 100, 200],
        dir: 'rtl',
        lang: 'he'
    };
    
    event.waitUntil(
        self.registration.showNotification('מערכת ניהול דיירים', options)
    );
});

// לחיצה על הודעה
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('[SW] Service Worker נטען בהצלחה');
