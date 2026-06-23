import sitemap from "@/app/sitemap"
import sitemapLastmod from "@/lib/sitemap-lastmod.json"
import routeGroups from "@/lib/sitemap-route-groups.json"
import { LOCALES } from "@/core/i18n/i18n"
import { TOOL_REGISTRY } from "@/core/registry"
import { TOOL_ALIAS_TO_CANONICAL_SLUG } from "@/core/registry/tool-aliases"
import { LEGACY_TAXONOMY_SLUGS } from "@/core/routing/seo-route-policy"
import { SITE_URL, buildCanonicalUrl } from "@/core/seo/urls"
import { describe, expect, it } from "vitest"

function normalizeLastModified(value: Date | string | undefined): string {
    if (!value) return ""
    const date = value instanceof Date ? value : new Date(value)
    return date.toISOString()
}

describe("sitemap lastmod", () => {
    const legacyTaxonomySlugSet = new Set(LEGACY_TAXONOMY_SLUGS)

    it("is deterministic across invocations", () => {
        const first = sitemap().map((entry) => normalizeLastModified(entry.lastModified))
        const second = sitemap().map((entry) => normalizeLastModified(entry.lastModified))

        expect(first).toEqual(second)
    })

    it("uses manifest-driven deterministic timestamps for entries without explicit updatedAt", () => {
        const entries = sitemap()
        const manifestHomeEn = sitemapLastmod.home?.en ?? ""
        const fallbackTool = TOOL_REGISTRY.find((tool) => !tool.updatedAt)

        expect(entries.length).toBeGreaterThan(0)
        const homeEntry = entries.find((entry) => entry.url.endsWith("/en"))
        expect(normalizeLastModified(homeEntry?.lastModified)).toBe(manifestHomeEn)

        if (fallbackTool) {
            const toolEntry = entries.find((entry) => entry.url.endsWith(`/en/${fallbackTool.slug}`))
            const toolManifest = sitemapLastmod.tools as Record<string, { en?: string }> | undefined
            const manifestToolEn = toolManifest?.[fallbackTool.slug]?.en ?? manifestHomeEn
            expect(normalizeLastModified(toolEntry?.lastModified)).toBe(manifestToolEn)
        }
    })

    it("contains both core and tool entries in a single sitemap", () => {
        const entries = sitemap()
        expect(entries.some((entry) => entry.url.endsWith("/en"))).toBe(true)
        expect(entries.some((entry) => entry.url.includes("/en/json-formatter"))).toBe(true)
        expect(entries.length).toBeGreaterThan(TOOL_REGISTRY.length)
    })

    it("contains every locale home and every canonical tool URL", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        expect(urls.has(`${SITE_URL}/`)).toBe(true)
        for (const locale of LOCALES) {
            expect(urls.has(buildCanonicalUrl(locale))).toBe(true)
            for (const tool of TOOL_REGISTRY) {
                expect(urls.has(buildCanonicalUrl(locale, tool.slug))).toBe(true)
            }
        }
    })

    it("contains current hub pages and excludes legacy alias sources", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        for (const locale of LOCALES) {
            for (const hub of routeGroups.hubSlugs) {
                if (legacyTaxonomySlugSet.has(hub)) continue
                expect(urls.has(buildCanonicalUrl(locale, hub))).toBe(true)
            }

            for (const legacySlug of Object.keys(TOOL_ALIAS_TO_CANONICAL_SLUG)) {
                expect(urls.has(buildCanonicalUrl(locale, legacySlug))).toBe(false)
            }
        }
    })

    it("contains BF-027 workflow index and detail pages", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        for (const locale of LOCALES) {
            expect(urls.has(buildCanonicalUrl(locale, "workflows"))).toBe(true)
            expect(urls.has(buildCanonicalUrl(locale, "workflows/api-payload-cleanup"))).toBe(true)
            expect(urls.has(buildCanonicalUrl(locale, "workflows/security-token-review"))).toBe(true)
            expect(urls.has(buildCanonicalUrl(locale, "workflows/log-scrub-before-sharing"))).toBe(true)
            expect(urls.has(buildCanonicalUrl(locale, "workflows/image-resize-social-export"))).toBe(true)
            expect(urls.has(buildCanonicalUrl(locale, "workflows/json-typescript-contract-review"))).toBe(true)
        }
    })

    it("excludes noindex static pages from sitemap output", () => {
        const urls = sitemap().map((entry) => entry.url)

        expect(urls.some((url) => url.endsWith("/en/about"))).toBe(false)
        expect(urls.some((url) => url.endsWith("/en/pricing"))).toBe(false)
        expect(urls.some((url) => url.endsWith("/en/terms"))).toBe(false)
        expect(urls.some((url) => url.endsWith("/zh-CN/about"))).toBe(false)

        expect(urls.some((url) => url.endsWith("/en/contact"))).toBe(true)
        expect(urls.some((url) => url.endsWith("/en/privacy"))).toBe(true)
        expect(urls.some((url) => url.endsWith("/en/trust-center"))).toBe(true)
    })

    it("contains BF-028 comparison, alternative, how-to, and fix content pages", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))
        const slugs = [
            "compare",
            "compare/byteflow-vs-cyberchef",
            "compare/byteflow-vs-jwt-io",
            "compare/md5-vs-sha256",
            "alternatives",
            "alternatives/json-formatter-privacy-first",
            "how-to",
            "how-to/decode-jwt-locally",
            "fix",
            "fix/base64-invalid-length",
        ]

        for (const locale of LOCALES) {
            for (const slug of slugs) {
                expect(urls.has(buildCanonicalUrl(locale, slug))).toBe(true)
            }
        }
    })

    it("excludes noindex legacy taxonomy hubs from sitemap output", () => {
        const urls = sitemap().map((entry) => entry.url)

        for (const slug of LEGACY_TAXONOMY_SLUGS) {
            expect(urls.some((url) => url.endsWith(`/en/${slug}`))).toBe(false)
            expect(urls.some((url) => url.endsWith(`/fr/${slug}`))).toBe(false)
        }
    })
})
