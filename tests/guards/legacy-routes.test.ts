import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { LEGACY_ROUTES, getLegacyRouteBySourceSlug } from "@/core/routing/legacy-routes"
import { TOOL_ALIAS_TO_CANONICAL_SLUG } from "@/core/registry/tool-aliases"
import { TOOL_REGISTRY } from "@/core/registry"
import sitemap from "@/app/sitemap"

const ROOT = process.cwd()
const APP_ROUTE_ROOT = path.join(ROOT, "src/app/[lang]")

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("legacy route redirects", () => {
    it("tracks tls-chain-inspector as a permanent redirect to certificate-decoder", () => {
        expect(getLegacyRouteBySourceSlug("tls-chain-inspector")).toMatchObject({
            targetSlug: "certificate-decoder",
            status: 301,
            reason: "merged",
        })
        expect(getLegacyRouteBySourceSlug("csv-to-json")).toMatchObject({
            targetSlug: "csv-json-converter",
            status: 301,
            reason: "renamed",
        })
    })

    it("keeps generated aliases and redirects aligned with the legacy route manifest", () => {
        const redirects = read("public/_redirects")
        const redirectRoutes = LEGACY_ROUTES.filter((route) => route.status === 301 || route.status === 302)

        expect(TOOL_ALIAS_TO_CANONICAL_SLUG).toEqual(
            Object.fromEntries(redirectRoutes.map((route) => [route.sourceSlug, route.targetSlug])),
        )

        for (const route of redirectRoutes) {
            expect(redirects).toContain(`/${route.sourceSlug} /en/${route.targetSlug} ${route.status}`)
            for (const locale of LOCALES) {
                expect(redirects).toContain(`/${locale}/${route.sourceSlug} /${locale}/${route.targetSlug} ${route.status}`)
            }
        }
    })

    it("redirects every locale-free canonical tool path to the default locale", () => {
        const redirects = read("public/_redirects")

        for (const tool of TOOL_REGISTRY) {
            expect(redirects).toContain(`/${tool.slug} /en/${tool.slug} 301`)
        }

        expect(redirects).toContain("/qr-code-generator /en/qr-code-generator 301")
        expect(redirects).toContain("/json-formatter /en/json-formatter 301")
        expect(redirects).toContain("/base64-encode-decode /en/base64-encode-decode 301")
    })

    it("keeps every legacy source out of sitemap while preserving valid targets", () => {
        const canonicalSlugs = new Set(TOOL_REGISTRY.map((tool) => tool.slug))
        const sitemapUrls = sitemap().map((entry) => entry.url)

        for (const route of LEGACY_ROUTES) {
            expect(fs.existsSync(path.join(APP_ROUTE_ROOT, route.sourceSlug, "page.tsx"))).toBe(true)
            expect(sitemapUrls.some((url) => url.includes(`/${route.sourceSlug}`))).toBe(false)

            if (route.status !== 410) {
                expect(canonicalSlugs.has(route.targetSlug ?? "")).toBe(true)
            }
        }
    })
})
