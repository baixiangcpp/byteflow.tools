import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import sitemap from "@/app/sitemap"
import { LOCALES } from "@/core/i18n/i18n"
import { LEGACY_TAXONOMY_SLUGS } from "@/core/routing/seo-route-policy"
import { TOOL_REGISTRY } from "@/core/registry"
import { buildCanonicalUrl } from "@/core/seo/urls"

const NOINDEX_STATIC_SLUGS = ["about", "pricing", "terms"]

describe("BF-047 sitemap audit", () => {
    it("contains only clean canonical byteflow URLs", () => {
        const urls = sitemap().map((entry) => entry.url)

        expect(new Set(urls).size).toBe(urls.length)
        for (const url of urls) {
            expect(url).toMatch(/^https:\/\/byteflow\.tools\/(?:$|(?:en|zh-CN|zh-TW|ja|ko|de|fr)(?:\/[^?#]*)?$)/)
            expect(url).not.toContain("?")
            expect(url).not.toContain("#")
            expect(url).not.toMatch(/\/all-tools\?.+/)
        }
    })

    it("excludes legacy taxonomy, redirected, and noindex routes", () => {
        const urls = sitemap().map((entry) => entry.url)

        for (const legacySlug of LEGACY_TAXONOMY_SLUGS) {
            expect(urls.some((url) => url.endsWith(`/${legacySlug}`)), legacySlug).toBe(false)
        }

        for (const locale of LOCALES) {
            for (const slug of NOINDEX_STATIC_SLUGS) {
                expect(urls).not.toContain(buildCanonicalUrl(locale, slug))
            }
        }
    })

    it("includes each canonical tool route for every locale with a self canonical URL", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        for (const locale of LOCALES) {
            for (const tool of TOOL_REGISTRY) {
                expect(urls.has(buildCanonicalUrl(locale, tool.slug)), `${locale}/${tool.slug}`).toBe(true)
            }
        }
    })

    it("wires export-level sitemap QA into build checks", () => {
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8"))
        const exportGate = fs.readFileSync(path.join(process.cwd(), "scripts/gates/check-sitemap-export.js"), "utf8")

        expect(packageJson.scripts["check:sitemap-export"]).toBe("node scripts/gates/check-sitemap-export.js")
        expect(packageJson.scripts["build:post"]).toContain("npm run check:sitemap-export")
        expect(exportGate).toContain("sitemap.xml")
        expect(exportGate).toContain("sitemap-audit-report.json")
        expect(exportGate).toContain("missing exported HTML file")
        expect(exportGate).toContain("exported page is noindex")
        expect(exportGate).toContain("canonical mismatch")
        expect(exportGate).toContain("parameterized URL")
        expect(exportGate).toContain("legacy taxonomy URL")
        expect(exportGate).toContain("assertAlternateSet")
    })
})
