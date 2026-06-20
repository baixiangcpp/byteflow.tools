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
        expect(source).toContain("if (hasSensitiveQuery(url)) return;")
    })

    it("keeps runtime cache bounded by size and age", () => {
        const source = fs.readFileSync(path.join(process.cwd(), "public", "sw.js"), "utf8")

        expect(source).toContain("const CACHE_META_NAME")
        expect(source).toContain("const MAX_RUNTIME_CACHE_ENTRIES")
        expect(source).toContain("const MAX_RUNTIME_CACHE_AGE_MS")
        expect(source).toContain("function pruneRuntimeCache()")
        expect(source).toContain("retained.slice(MAX_RUNTIME_CACHE_ENTRIES)")
        expect(source).toContain("now - entry.cachedAt > MAX_RUNTIME_CACHE_AGE_MS")
        expect(source).toContain("function putRuntimeCache(request, response)")
        const cacheWrites = source.match(/putRuntimeCache\(event\.request, response\)/g) ?? []
        const guardedCacheWrites = source.match(/event\.waitUntil\(putRuntimeCache\(event\.request, response\)\.catch\(\(\) => undefined\)\)/g) ?? []
        expect(guardedCacheWrites).toHaveLength(cacheWrites.length)
    })
})
