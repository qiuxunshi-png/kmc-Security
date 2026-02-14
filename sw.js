const CACHE_NAME = 'kmc-siteops-cache-v1';
const CORE_ASSETS = [
    './',
    './index.html',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Caching core assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const requestUrl = event.request.url;
    // 凡是 Supabase 的数据库请求，绝对不缓存（必须走网络或我们自己写的本地离线队列）
    if (requestUrl.includes('supabase.co')) return; 

    // 网页和UI资源：网络优先，断网退回缓存
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                }
                return networkResponse;
            })
            .catch(() => {
                console.log('[SW] Offline. Serving from cache:', requestUrl);
                return caches.match(event.request);
            })
    );
});