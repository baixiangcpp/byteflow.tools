import sitemap from "@/app/sitemap"
import robots from "@/app/robots"
import { buildStaticPageMetadata } from "@/core/seo/seo"
import { getLegacyTaxonomyTarget, shouldNoindexAllToolsUrl, SITE_URL } from "@/core/routing/seo-route-policy"
import legacyTaxonomyRedirects from "@/core/routing/legacy-taxonomy-redirects.json"
import { LOCALES } from "@/core/i18n/i18n"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("BF P0 SEO routing policy", () => {
    it("maps legacy taxonomy slugs to canonical destinations", () => {
        expect(getLegacyTaxonomyTarget("web-api")).toBe("web-api-network")
        expect(getLegacyTaxonomyTarget("design-media")).toBe("images-svg-css")
        expect(getLegacyTaxonomyTarget("convert-encode")).toBe("all-tools")
        expect(legacyTaxonomyRedirects).toMatchObject({
            "web-api": "web-api-network",
            "design-media": "images-svg-css",
            "convert-encode": "all-tools",
        })
    })

    it("ships deployment-level 301 redirects for legacy taxonomy slugs", () => {
        const redirects = readFileSync("public/_redirects", "utf8")
        const canonicalGateSource = readFileSync("scripts/gates/check-canonical.js", "utf8")
        const hreflangGateSource = readFileSync("scripts/gates/check-hreflang.js", "utf8")

        for (const locale of LOCALES) {
            expect(redirects).toContain(`/${locale}/web-api /${locale}/web-api-network 301`)
            expect(redirects).toContain(`/${locale}/design-media /${locale}/images-svg-css 301`)
            expect(redirects).toContain(`/${locale}/convert-encode /${locale}/all-tools 301`)
        }

        expect(canonicalGateSource).toContain("legacy-taxonomy-redirects.json")
        expect(hreflangGateSource).toContain("legacy-taxonomy-redirects.json")
    })

    it("keeps legacy taxonomy URLs out of the sitemap", () => {
        const urls = sitemap().map((entry) => entry.url)
        for (const locale of LOCALES) {
            expect(urls).not.toContain(`${SITE_URL}/${locale}/web-api`)
            expect(urls).not.toContain(`${SITE_URL}/${locale}/design-media`)
            expect(urls).not.toContain(`${SITE_URL}/${locale}/convert-encode`)
            expect(urls).toContain(`${SITE_URL}/${locale}/web-api-network`)
            expect(urls).toContain(`${SITE_URL}/${locale}/images-svg-css`)
            expect(urls).toContain(`${SITE_URL}/${locale}/all-tools`)
        }
    })

    it("keeps primary internal category navigation on current taxonomy slugs", () => {
        const primarySlugs = MENU_GROUP_DEFS.map((group) => group.slug)

        expect(primarySlugs).toContain("web-api-network")
        expect(primarySlugs).toContain("images-svg-css")
        expect(primarySlugs).not.toContain("web-api")
        expect(primarySlugs).not.toContain("design-media")
        expect(primarySlugs).not.toContain("convert-encode")
    })

    it("self-canonicalizes current category pages and includes reciprocal hreflang", () => {
        const metadata = buildStaticPageMetadata({
            lang: "en",
            slug: "all-tools",
            title: "All tools",
            description: "Browse all browser-local tools.",
        })

        expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en/all-tools`)
        expect(metadata.alternates?.languages).toMatchObject({
            en: `${SITE_URL}/en/all-tools`,
            "zh-CN": `${SITE_URL}/zh-CN/all-tools`,
            "zh-TW": `${SITE_URL}/zh-TW/all-tools`,
            ja: `${SITE_URL}/ja/all-tools`,
            ko: `${SITE_URL}/ko/all-tools`,
            de: `${SITE_URL}/de/all-tools`,
            fr: `${SITE_URL}/fr/all-tools`,
            "x-default": `${SITE_URL}/en/all-tools`,
        })
    })

    it("treats filtered and searched all-tools URLs as non-indexable variants", () => {
        expect(shouldNoindexAllToolsUrl("/en/all-tools")).toBe(false)
        expect(shouldNoindexAllToolsUrl("/en/all-tools?search=json")).toBe(true)
        expect(shouldNoindexAllToolsUrl("/en/all-tools?category=network")).toBe(true)
        expect(shouldNoindexAllToolsUrl("/en/all-tools?execution=local")).toBe(true)
        expect(shouldNoindexAllToolsUrl("/en/all-tools?input=file")).toBe(true)
        expect(shouldNoindexAllToolsUrl("/en/all-tools?use=security")).toBe(true)
        expect(shouldNoindexAllToolsUrl("/en/all-tools?family=data-formats&tag=json")).toBe(true)
    })

    it("keeps all-tools query noindex local to the browser without persisting query text", () => {
        const pageSource = readFileSync("src/features/tool-discovery/all-tools-query-robots.tsx", "utf8")

        expect(pageSource).toContain("noindex,follow")
        expect(pageSource).toContain("window.location.href")
        expect(pageSource).not.toMatch(/localStorage|sessionStorage|indexedDB|fetch\(/)
    })

    it("blocks common all-tools query states in robots.txt while leaving the clean route crawlable", () => {
        const policy = robots()
        const rules = Array.isArray(policy.rules) ? policy.rules[0] : policy.rules
        expect(rules.allow).toBe("/")
        expect(rules.disallow).toEqual(
            expect.arrayContaining([
                "/*/all-tools?search=",
                "/*/all-tools?category=",
                "/*/all-tools?execution=",
                "/*/all-tools?family=",
                "/*/all-tools?input=",
                "/*/all-tools?tag=",
                "/*/all-tools?use=",
            ]),
        )
        expect(rules.disallow).not.toContain("/*/all-tools")
    })
})
