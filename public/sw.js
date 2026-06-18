/**
 * byteflow.tools Service Worker
 *
 * Build-time versioning:
 * - Keep APP_VERSION as "__BUILD_ID__" in source control.
 * - During `npm run build`, `npm run build:sw` injects the commit build id into `out/sw.js`.
 */
const APP_VERSION = '__BUILD_ID__';
const CACHE_NAME = `byteflow-v${APP_VERSION}`;
const OFFLINE_FALLBACK_URL = '/offline.html';
const OFFLINE_FALLBACK_CANDIDATES = [OFFLINE_FALLBACK_URL, '/offline'];

const STATIC_ASSETS = [
    '/manifest.json',
    '/manifest.zh-CN.json',
    '/manifest.zh-TW.json',
    '/manifest.ja.json',
    '/manifest.ko.json',
    '/manifest.de.json',
    '/manifest.fr.json',
    '/favicon.ico',
    '/icon-192.png',
    '/icon-maskable-192.png',
    '/icon-512.png',
    '/icon-maskable-512.png',
    '/icon.png',
    '/apple-icon.png',
    ...OFFLINE_FALLBACK_CANDIDATES,
];

const SENSITIVE_QUERY_PARAMS = [
    'handoff',
    'handoff_ref',
    'token',
    'secret',
    'payload',
    'key',
    'authorization',
];

function hasSensitiveQuery(url) {
    return SENSITIVE_QUERY_PARAMS.some((param) => url.searchParams.has(param));
}

function matchOfflineFallback() {
    return caches.match(OFFLINE_FALLBACK_URL)
        .then((cached) => cached || caches.match('/offline'))
        .then((cached) => cached || new Response(
            '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Offline | byteflow.tools</title></head><body><main><h1>You are offline</h1><p>Reconnect and refresh, or open a page you have visited before.</p></main></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        ));
}

// Install: cache critical static assets; waiting/activation is user-triggered from the app shell.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

// Allow client to activate an updated waiting worker only after explicit user intent.
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Activate: purge old caches and notify clients that an update is ready
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            )
        ).then(() => {
            // Notify all open tabs that a new version is active
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
                });
            });
        })
    );
    self.clients.claim();
});

// Fetch: network-first for _next chunks (always get latest code),
//        cache-first for truly static assets (fonts, images)
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    // Do not cache or intercept third-party requests.
    if (url.origin !== self.location.origin) return;
    // Keep tool payloads and secret-like query strings out of CacheStorage.
    if (hasSensitiveQuery(url)) return;

    // Network-first for Next.js chunks and pages (ensures fresh code)
    if (
        url.pathname.startsWith('/_next/') ||
        url.pathname.endsWith('.html') ||
        event.request.headers.get('accept')?.includes('text/html')
    ) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then((cached) => cached || matchOfflineFallback())
                )
        );
        return;
    }

    // Cache-first for truly static assets (fonts, images, icons)
    if (url.pathname.match(/\.(woff2?|ttf|png|jpg|jpeg|svg|ico|webp)$/)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Default: network-first
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then((cached) => cached || matchOfflineFallback())
            )
    );
});
