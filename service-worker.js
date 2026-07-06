const CACHE_NAME = 'ksd-monitor-pwa-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://unpkg.com/lucide@latest',
    'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    // Strategy: Cache First for static assets and CDN
    if (e.request.url.includes('cdn.jsdelivr.net') || 
        e.request.url.includes('unpkg.com') || 
        e.request.url.includes('cdnjs.cloudflare.com') || 
        e.request.url.includes('fonts.googleapis.com') || 
        e.request.url.includes('fonts.gstatic.com')) {
        
        e.respondWith(
            caches.match(e.request).then((response) => {
                return response || fetch(e.request).then((fetchRes) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, fetchRes.clone());
                        return fetchRes;
                    });
                });
            })
        );
        return;
    }

    // Network First for everything else (Apps Script iframe)
    e.respondWith(
        fetch(e.request).catch(() => {
            return caches.match(e.request).then((response) => {
                if (response) {
                    return response;
                }
                // Fallback offline message
                return new Response(
                    '<div style="color:white; font-family:sans-serif; text-align:center; padding:50px; background:#0F172A; height:100vh;"><h2>Koneksi Terputus</h2><p>Aplikasi KSD Monitor memerlukan koneksi internet untuk memuat data dari server.</p></div>',
                    { headers: { 'Content-Type': 'text/html' } }
                );
            });
        })
    );
});
