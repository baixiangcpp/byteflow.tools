import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { LOCALIZED_ARTICLES } from "@/core/seo/localized-articles"
import { TOOL_ALIAS_TO_CANONICAL_SLUG } from "@/core/registry/tool-aliases"
import { TOOL_REGISTRY } from "@/core/registry"

const ROUTE_ROOT = path.join(process.cwd(), "src/app/[lang]")
const ROUTE_GROUPS = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "src/lib/sitemap-route-groups.json"), "utf8"),
) as {
    hubSlugs: string[]
    staticSlugs: string[]
}

const FOCUSED_HASH_ROUTE_TARGETS: Record<string, string> = {
    "md5-digest-generator": "hash-generator",
    "sha1-digest-generator": "hash-generator",
    "sha224-digest-generator": "hash-generator",
    "sha256-digest-generator": "hash-generator",
    "sha384-digest-generator": "hash-generator",
    "sha512-digest-generator": "hash-generator",
}

const EXTRA_TOOL_ROUTE_TARGETS: Record<string, string> = {
    "css-formatter": "html-css-beautifier",
    ...FOCUSED_HASH_ROUTE_TARGETS,
    ...TOOL_ALIAS_TO_CANONICAL_SLUG,
}

const SPECIAL_PAGE_SLUGS = new Set(["install-app"])
const REMOVED_DUPLICATE_ENTRY_SLUGS = [
    "hex-to-rgba-converter",
    "image-to-base64-converter",
    "ip-address-lookup",
    "json-minifier",
    "json-to-yaml",
    "json-validator",
    "markdown-to-html",
    "redirect-checker",
    "rgba-to-hex-converter",
    "security-headers-checker",
    "ssl-checker",
    "strong-random-password-generator",
    "timestamp-converter",
    "url-slug-generator",
    "what-is-my-ip",
    "whois-lookup",
    "yaml-to-json",
] as const

const CANONICAL_TOOL_SLUGS = new Set(TOOL_REGISTRY.map((tool) => tool.slug))
const ARTICLE_SLUGS = new Set(Object.keys(LOCALIZED_ARTICLES))
const HUB_SLUGS = new Set(ROUTE_GROUPS.hubSlugs)
const STATIC_SLUGS = new Set(ROUTE_GROUPS.staticSlugs)
const SPECIAL_TOOL_ROUTE_TARGETS: Record<string, string> = EXTRA_TOOL_ROUTE_TARGETS

function getLocalizedPageRouteSlugs() {
    return fs.readdirSync(ROUTE_ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((slug) => fs.existsSync(path.join(ROUTE_ROOT, slug, "page.tsx")))
        .sort()
}

function readLayoutSource(slug: string) {
    return fs.readFileSync(path.join(ROUTE_ROOT, slug, "layout.tsx"), "utf8")
}

function readRouteSource(slug: string) {
    const layoutPath = path.join(ROUTE_ROOT, slug, "layout.tsx")
    if (fs.existsSync(layoutPath)) {
        return fs.readFileSync(layoutPath, "utf8")
    }

    return fs.readFileSync(path.join(ROUTE_ROOT, slug, "page.tsx"), "utf8")
}

function classifyRoute(slug: string) {
    if (CANONICAL_TOOL_SLUGS.has(slug)) return "canonical-tool"
    if (slug in SPECIAL_TOOL_ROUTE_TARGETS) return "special-tool-route"
    if (ARTICLE_SLUGS.has(slug)) return "article"
    if (HUB_SLUGS.has(slug)) return "hub"
    if (STATIC_SLUGS.has(slug)) return "static"
    if (SPECIAL_PAGE_SLUGS.has(slug)) return "special-page"
    return "unknown"
}

describe("route semantic alignment", () => {
    it("classifies every localized page route into a known route family", () => {
        const unknownRoutes = getLocalizedPageRouteSlugs()
            .filter((slug) => classifyRoute(slug) === "unknown")

        expect(unknownRoutes).toEqual([])
    })

    it("keeps removed duplicate-entry tool routes deleted", () => {
        for (const slug of REMOVED_DUPLICATE_ENTRY_SLUGS) {
            expect(fs.existsSync(path.join(ROUTE_ROOT, slug, "page.tsx"))).toBe(false)
            expect(fs.existsSync(path.join(ROUTE_ROOT, slug, "layout.tsx"))).toBe(false)
        }
    })

    it("keeps canonical tool layouts aligned with their own route slug", () => {
        for (const slug of CANONICAL_TOOL_SLUGS) {
            const layoutPath = path.join(ROUTE_ROOT, slug, "layout.tsx")
            if (!fs.existsSync(layoutPath)) continue

            const source = readLayoutSource(slug)

            expect(source).toContain(`slug: "${slug}"`)

            if (source.includes("ToolContentTemplateServer")) {
                expect(source).toContain(`toolSlug="${slug}"`)
            }
        }
    })

    it("keeps special tool routes explicitly pinned to their semantic source", () => {
        for (const [routeSlug, targetSlug] of Object.entries(SPECIAL_TOOL_ROUTE_TARGETS)) {
            const source = readRouteSource(routeSlug)
            const hasOwnLayout = fs.existsSync(path.join(ROUTE_ROOT, routeSlug, "layout.tsx"))

            if (hasOwnLayout) {
                expect(source).toContain(routeSlug)
            } else {
                expect(source).toContain("LegacyToolRedirectPage")
            }
            expect(source).toContain(targetSlug)

            if (source.includes("ToolContentTemplateServer")) {
                expect(source).toContain(`toolSlug="${targetSlug}"`)
            }
        }
    })

    it("blocks misleading digest route naming from coming back", () => {
        for (const routeSlug of Object.keys(FOCUSED_HASH_ROUTE_TARGETS)) {
            const source = readLayoutSource(routeSlug)

            expect(routeSlug).toContain("-digest-generator")
            expect(source).toContain("Digest Generator")
            expect(source).not.toContain("encrypt-decrypt")
        }
    })
})
