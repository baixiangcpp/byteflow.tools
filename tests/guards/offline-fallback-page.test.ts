import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

describe("offline fallback page", () => {
    it("keeps the public offline shell out of search indexing", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "offline.html"), "utf8")

        expect(source).toContain("<title>Offline | byteflow.tools</title>")
        expect(source).toContain('name="description"')
        expect(source).toContain('name="robots" content="noindex, nofollow"')
        expect(source).toContain('rel="canonical" href="https://byteflow.tools/offline.html"')
    })

    it("keeps service worker offline fallback coverage for uncached routes", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("const OFFLINE_FALLBACK_CANDIDATES = [OFFLINE_FALLBACK_URL, '/offline']")
        expect(source).toContain("function matchOfflineFallback()")
        expect(source).toContain("cached || matchOfflineFallback()")
        expect(source).toContain("new Response(")
        expect(source).toContain("You are offline")
    })

    it("keeps tool payload query strings out of CacheStorage", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("const SENSITIVE_QUERY_PARAMS = [")
        expect(source).toContain("'access_token'")
        expect(source).toContain("'api_key'")
        expect(source).toContain("'handoff'")
        expect(source).toContain("'handoff_ref'")
        expect(source).toContain("'jwt'")
        expect(source).toContain("'secret'")
        expect(source).toContain("'session'")
        expect(source).toContain("'signature'")
        expect(source).toContain("param.toLowerCase()")
        expect(source).toContain("function hasSensitiveQuery(url)")
        expect(source).toContain("hasSensitiveQuery(url) ||")
        expect(source).toContain("if (isNetworkOnlyRequest(event.request, url)) return;")
    })

    it("keeps PWA caches versioned and separated by resource class", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("const CACHE_PREFIX = 'byteflow-';")
        expect(source).toContain("const APP_SHELL_CACHE_NAME = `byteflow-app-shell-v${APP_VERSION}`")
        expect(source).toContain("const STATIC_ASSET_CACHE_NAME = `byteflow-static-assets-v${APP_VERSION}`")
        expect(source).toContain("const TOOL_CHUNK_CACHE_NAME = `byteflow-tool-chunks-v${APP_VERSION}`")
        expect(source).toContain("const MANIFEST_ICON_CACHE_NAME = `byteflow-manifest-icons-v${APP_VERSION}`")
        expect(source).toContain("const RUNTIME_PAGE_CACHE_NAME = `byteflow-runtime-pages-v${APP_VERSION}`")
        expect(source).toContain("const ACTIVE_CACHE_NAMES = [")
        expect(source).toContain("const APP_SHELL_ASSETS = [")
        expect(source).toContain("const MANIFEST_ICON_ASSETS = [")
        expect(source).toContain("function selectCacheName(request, url)")
        expect(source).toContain("if (isToolChunkRequest(url)) return TOOL_CHUNK_CACHE_NAME;")
        expect(source).toContain("if (isManifestOrIconRequest(url)) return MANIFEST_ICON_CACHE_NAME;")
        expect(source).toContain("name.startsWith(CACHE_PREFIX) && !ACTIVE_CACHE_NAMES.includes(name)")
    })

    it("keeps external-request and explicit network-only fetches out of service-worker caches", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("function isNetworkOnlyRequest(request, url)")
        expect(source).toContain("url.origin !== self.location.origin")
        expect(source).toContain("request.headers.get('x-byteflow-cache-mode') === 'network-only'")
        expect(source).toContain("request.headers.get('x-byteflow-external-request') === '1'")
        expect(source).toContain("url.pathname.startsWith('/api/')")
        expect(source).toContain("if (isNetworkOnlyRequest(event.request, url)) return;")
    })

    it("keeps PWA smoke covering representative offline tool flows", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "scripts/e2e/run-playwright-smoke.js"), "utf8")

        expect(source).toContain("/en/json-formatter")
        expect(source).toContain("offline JSON formatter output")
        expect(source).toContain("/en/har-viewer-sanitizer")
        expect(source).toContain("offline HAR sanitizer output")
        expect(source).toContain("/en/pipeline-builder")
        expect(source).toContain("offline pipeline")
        expect(source).toContain("/en/youtube-thumbnail-grabber")
        expect(source).toContain("external-request action needs network access")
    })

    it("lets users clear byteflow PWA caches without clearing tool payload storage", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("function deleteByteflowCaches()")
        expect(source).toContain("name.startsWith(CACHE_PREFIX)")
        expect(source).toContain("event.data?.type === 'CLEAR_BYTEFLOW_CACHES'")
        expect(source).toContain("BYTEFLOW_CACHES_CLEARED")
    })

    it("keeps runtime cache bounded by size and age", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("const CACHE_META_NAME")
        expect(source).toContain("const MAX_RUNTIME_CACHE_ENTRIES")
        expect(source).toContain("const MAX_RUNTIME_CACHE_AGE_MS")
        expect(source).toContain("const CACHE_WRITE_PAUSE_AFTER_CLEAR_MS")
        expect(source).toContain("let cacheWritesPausedUntil = 0;")
        expect(source).toContain("function pruneRuntimeCache(cacheName)")
        expect(source).toContain("retained.slice(MAX_RUNTIME_CACHE_ENTRIES)")
        expect(source).toContain("now - entry.cachedAt > MAX_RUNTIME_CACHE_AGE_MS")
        expect(source).toContain("function isCacheWritePaused()")
        expect(source).toContain("function discardRuntimeCacheWrite(cacheName)")
        expect(source).toContain("caches.delete(cacheName)")
        expect(source).toContain("function putRuntimeCache(request, response, cacheName)")
        expect(source).toContain("if (isCacheWritePaused()) return Promise.resolve();")
        expect(source).toContain("if (isCacheWritePaused()) return discardRuntimeCacheWrite(cacheName);")
        const cacheWrites = source.match(/putRuntimeCache\(event\.request, response, cacheName\)/g) ?? []
        const guardedCacheWrites = source.match(/event\.waitUntil\(putRuntimeCache\(event\.request, response, cacheName\)\.catch\(\(\) => undefined\)\)/g) ?? []
        expect(guardedCacheWrites).toHaveLength(cacheWrites.length)
    })
})
