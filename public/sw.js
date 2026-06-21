/**
 * byteflow.tools Service Worker
 *
 * Build-time versioning:
 * - Keep APP_VERSION as "__BUILD_ID__" in source control.
 * - During `npm run build`, `npm run build:sw` injects the commit build id into `out/sw.js`.
 */
const APP_VERSION = '__BUILD_ID__';
const CACHE_PREFIX = 'byteflow-';
const APP_SHELL_CACHE_NAME = `byteflow-app-shell-v${APP_VERSION}`;
const STATIC_ASSET_CACHE_NAME = `byteflow-static-assets-v${APP_VERSION}`;
const TOOL_CHUNK_CACHE_NAME = `byteflow-tool-chunks-v${APP_VERSION}`;
const MANIFEST_ICON_CACHE_NAME = `byteflow-manifest-icons-v${APP_VERSION}`;
const RUNTIME_PAGE_CACHE_NAME = `byteflow-runtime-pages-v${APP_VERSION}`;
const CACHE_META_NAME = `byteflow-meta-v${APP_VERSION}`;
const ACTIVE_CACHE_NAMES = [
    APP_SHELL_CACHE_NAME,
    STATIC_ASSET_CACHE_NAME,
    TOOL_CHUNK_CACHE_NAME,
    MANIFEST_ICON_CACHE_NAME,
    RUNTIME_PAGE_CACHE_NAME,
    CACHE_META_NAME,
];
const OFFLINE_FALLBACK_URL = '/offline.html';
const OFFLINE_FALLBACK_CANDIDATES = [OFFLINE_FALLBACK_URL, '/offline'];
const MAX_RUNTIME_CACHE_ENTRIES = 120;
const MAX_RUNTIME_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_META_URL_PREFIX = '/__byteflow-cache-meta__?url=';

const APP_SHELL_ASSETS = [
    ...OFFLINE_FALLBACK_CANDIDATES,
];

const MANIFEST_ICON_ASSETS = [
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
];

const CACHEABLE_STATIC_ASSET_PATTERN = /\.(?:css|js|woff2?|ttf|png|jpg|jpeg|svg|ico|webp)$/i;

const SENSITIVE_QUERY_PARAMS = [
    'access_token',
    'apikey',
    'api_key',
    'auth',
    'auth_token',
    'credential',
    'handoff',
    'handoff_ref',
    'id_token',
    'jwt',
    'key',
    'authorization',
    'password',
    'passwd',
    'payload',
    'pwd',
    'refresh_token',
    'secret',
    'session',
    'session_id',
    'sessionid',
    'signature',
    'token',
];

function hasSensitiveQuery(url) {
    const sensitiveParams = new Set(SENSITIVE_QUERY_PARAMS);
    for (const param of url.searchParams.keys()) {
        if (sensitiveParams.has(param.toLowerCase())) return true;
    }
    return false;
}

function matchOfflineFallback() {
    return caches.match(OFFLINE_FALLBACK_URL)
        .then((cached) => cached || caches.match('/offline'))
        .then((cached) => cached || new Response(
            '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Offline | byteflow.tools</title></head><body><main><h1>You are offline</h1><p>Reconnect and refresh, or open a page you have visited before.</p></main></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
        ));
}

function cacheMetaRequest(cacheName, request) {
    return new Request(`${CACHE_META_URL_PREFIX}${encodeURIComponent(`${cacheName}:${request.url}`)}`);
}

function rememberCachedRequest(cacheName, request) {
    return caches.open(CACHE_META_NAME)
        .then((metaCache) => metaCache.put(cacheMetaRequest(cacheName, request), new Response(String(Date.now()))));
}

function readCachedAt(cacheName, metaCache, request) {
    return metaCache.match(cacheMetaRequest(cacheName, request))
        .then((response) => response ? response.text() : '0')
        .then((value) => {
            const timestamp = Number(value);
            return Number.isFinite(timestamp) ? timestamp : 0;
        });
}

function pruneRuntimeCache(cacheName) {
    const now = Date.now();
    return Promise.all([caches.open(cacheName), caches.open(CACHE_META_NAME)])
        .then(([runtimeCache, metaCache]) => runtimeCache.keys()
            .then((requests) => Promise.all(requests.map((request) =>
                readCachedAt(cacheName, metaCache, request).then((cachedAt) => ({ request, cachedAt }))
            )))
            .then((entries) => {
                const entriesWithExpiry = entries.map((entry) => ({
                    ...entry,
                    expired: entry.cachedAt > 0 && now - entry.cachedAt > MAX_RUNTIME_CACHE_AGE_MS,
                }));
                const expired = entriesWithExpiry.filter((entry) => entry.expired);
                const retained = entriesWithExpiry
                    .filter((entry) => !entry.expired)
                    .sort((a, b) => b.cachedAt - a.cachedAt);
                const overflow = retained.slice(MAX_RUNTIME_CACHE_ENTRIES);
                return Promise.all([...expired, ...overflow].map((entry) =>
                    Promise.all([
                        runtimeCache.delete(entry.request),
                        metaCache.delete(cacheMetaRequest(cacheName, entry.request)),
                    ])
                ));
            }));
}

function putRuntimeCache(request, response, cacheName) {
    const clone = response.clone();
    return caches.open(cacheName)
        .then((cache) => cache.put(request, clone))
        .then(() => rememberCachedRequest(cacheName, request))
        .then(() => pruneRuntimeCache(cacheName));
}

function isNetworkOnlyRequest(request, url) {
    return (
        url.origin !== self.location.origin ||
        hasSensitiveQuery(url) ||
        request.headers.get('x-byteflow-cache-mode') === 'network-only' ||
        request.headers.get('x-byteflow-external-request') === '1' ||
        url.pathname.startsWith('/api/')
    );
}

function isHtmlRequest(request, url) {
    return url.pathname.endsWith('.html') || request.headers.get('accept')?.includes('text/html');
}

function isToolChunkRequest(url) {
    return url.pathname.startsWith('/_next/static/chunks/');
}

function isNextStaticAssetRequest(url) {
    return url.pathname.startsWith('/_next/static/');
}

function isManifestOrIconRequest(url) {
    return MANIFEST_ICON_ASSETS.includes(url.pathname);
}

function selectCacheName(request, url) {
    if (isHtmlRequest(request, url)) return RUNTIME_PAGE_CACHE_NAME;
    if (isToolChunkRequest(url)) return TOOL_CHUNK_CACHE_NAME;
    if (isManifestOrIconRequest(url)) return MANIFEST_ICON_CACHE_NAME;
    if (isNextStaticAssetRequest(url) || CACHEABLE_STATIC_ASSET_PATTERN.test(url.pathname)) return STATIC_ASSET_CACHE_NAME;
    return STATIC_ASSET_CACHE_NAME;
}

function deleteByteflowCaches() {
    return caches.keys().then((names) =>
        Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)))
    );
}

// Install: cache critical static assets; waiting/activation is user-triggered from the app shell.
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(APP_SHELL_CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)),
            caches.open(MANIFEST_ICON_CACHE_NAME).then((cache) => cache.addAll(MANIFEST_ICON_ASSETS)),
        ])
    );
});

// Allow client to activate an updated waiting worker only after explicit user intent.
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'CLEAR_BYTEFLOW_CACHES') {
        event.waitUntil(
            deleteByteflowCaches().then(() => {
                event.source?.postMessage({ type: 'BYTEFLOW_CACHES_CLEARED', version: APP_VERSION });
            })
        );
    }
});

// Activate: purge old Byteflow caches and notify clients that an update is ready.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((names) =>
            Promise.all(
                names
                    .filter((name) => name.startsWith(CACHE_PREFIX) && !ACTIVE_CACHE_NAMES.includes(name))
                    .map((name) => caches.delete(name))
            )
        ).then(() => {
            self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
                });
            });
        })
    );
    self.clients.claim();
});

// Fetch: network-first for pages and Next.js chunks; cache-first for static assets.
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    // Network-only for third-party requests, API/external probes, and secret-like query strings.
    if (isNetworkOnlyRequest(event.request, url)) return;

    const cacheName = selectCacheName(event.request, url);

    // Network-first for Next.js chunks and pages (ensures fresh code)
    if (
        url.pathname.startsWith('/_next/') ||
        isHtmlRequest(event.request, url)
    ) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        event.waitUntil(putRuntimeCache(event.request, response, cacheName).catch(() => undefined));
                    }
                    return response;
                })
                .catch(() =>
                    caches.match(event.request).then((cached) => cached || matchOfflineFallback())
                )
        );
        return;
    }

    // Cache-first for manifest, icons, fonts, images, and other static assets.
    if (isManifestOrIconRequest(url) || CACHEABLE_STATIC_ASSET_PATTERN.test(url.pathname)) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    if (response.ok) {
                        event.waitUntil(putRuntimeCache(event.request, response, cacheName).catch(() => undefined));
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
                    event.waitUntil(putRuntimeCache(event.request, response, cacheName).catch(() => undefined));
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then((cached) => cached || matchOfflineFallback())
            )
    );
});
