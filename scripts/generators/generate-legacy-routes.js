import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const ROOT = process.cwd()
const LEGACY_ROUTES_PATH = path.join(ROOT, "src/core/routing/legacy-routes.json")
const LEGACY_TAXONOMY_REDIRECTS_PATH = path.join(ROOT, "src/core/routing/legacy-taxonomy-redirects.json")
const TOOL_ALIASES_PATH = path.join(ROOT, "src/core/registry/tool-aliases.json")
const REDIRECTS_PATH = path.join(ROOT, "public/_redirects")
const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"]
const DEFAULT_LOCALE = "en"
const REDIRECT_STATUSES = new Set([301, 302])
const STATIC_REDIRECT_LINES = [
    "/security.txt /.well-known/security.txt 301",
    "/en / 301",
]
const CHECK_ONLY = process.argv.includes("--check")

function readText(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

function stableStringify(value) {
    return `${JSON.stringify(value, null, 2)}\n`
}

export function loadLegacyRoutes() {
    const routes = JSON.parse(readText(LEGACY_ROUTES_PATH))
    if (!Array.isArray(routes)) {
        throw new Error("[legacy-routes] legacy-routes.json must be an array")
    }

    const sourceSlugs = new Set()
    for (const route of routes) {
        if (!route || typeof route !== "object") {
            throw new Error("[legacy-routes] each route must be an object")
        }
        if (typeof route.sourceSlug !== "string" || !route.sourceSlug.trim()) {
            throw new Error("[legacy-routes] sourceSlug is required")
        }
        if (![301, 302, 410].includes(route.status)) {
            throw new Error(`[legacy-routes] ${route.sourceSlug}: status must be 301, 302, or 410`)
        }
        if (sourceSlugs.has(route.sourceSlug)) {
            throw new Error(`[legacy-routes] duplicate sourceSlug: ${route.sourceSlug}`)
        }
        sourceSlugs.add(route.sourceSlug)

        if (REDIRECT_STATUSES.has(route.status)) {
            if (typeof route.targetSlug !== "string" || !route.targetSlug.trim()) {
                throw new Error(`[legacy-routes] ${route.sourceSlug}: targetSlug is required for ${route.status}`)
            }
            if (route.sourceSlug === route.targetSlug) {
                throw new Error(`[legacy-routes] ${route.sourceSlug}: targetSlug must differ from sourceSlug`)
            }
        }
    }

    return routes
}

export function buildToolAliasesSource(routes = loadLegacyRoutes()) {
    const aliases = Object.fromEntries(
        routes
            .filter((route) => REDIRECT_STATUSES.has(route.status))
            .map((route) => [route.sourceSlug, route.targetSlug]),
    )

    return stableStringify(aliases)
}

export function loadLegacyTaxonomyRedirects() {
    if (!fs.existsSync(LEGACY_TAXONOMY_REDIRECTS_PATH)) return {}
    const redirects = JSON.parse(readText(LEGACY_TAXONOMY_REDIRECTS_PATH))
    if (!redirects || typeof redirects !== "object" || Array.isArray(redirects)) {
        throw new Error("[legacy-routes] legacy-taxonomy-redirects.json must be an object")
    }

    const validated = {}
    for (const [sourceSlug, targetSlug] of Object.entries(redirects)) {
        if (typeof sourceSlug !== "string" || !sourceSlug.trim()) {
            throw new Error("[legacy-routes] taxonomy source slug is required")
        }
        if (typeof targetSlug !== "string" || !targetSlug.trim()) {
            throw new Error(`[legacy-routes] ${sourceSlug}: taxonomy target slug is required`)
        }
        if (sourceSlug === targetSlug) {
            throw new Error(`[legacy-routes] ${sourceSlug}: taxonomy targetSlug must differ from sourceSlug`)
        }
        validated[sourceSlug] = targetSlug
    }

    return validated
}

function loadCanonicalToolSlugs() {
    return loadOrderedToolManifests().map((tool) => tool.slug)
}

function buildRedirectLines(
    routes,
    taxonomyRedirects = loadLegacyTaxonomyRedirects(),
    canonicalToolSlugs = loadCanonicalToolSlugs(),
) {
    return [
        ...STATIC_REDIRECT_LINES,
        ...canonicalToolSlugs.map((slug) => `/${slug} /${DEFAULT_LOCALE}/${slug} 301`),
        ...routes.flatMap((route) => {
            if (!REDIRECT_STATUSES.has(route.status)) return []
            return [`/${route.sourceSlug} /${DEFAULT_LOCALE}/${route.targetSlug} ${route.status}`]
        }),
        ...Object.entries(taxonomyRedirects).map(([sourceSlug, targetSlug]) => (
            `/${sourceSlug} /${DEFAULT_LOCALE}/${targetSlug} 301`
        )),
        ...routes.flatMap((route) => {
            if (!REDIRECT_STATUSES.has(route.status)) return []
            return LOCALES.map((locale) => `/${locale}/${route.sourceSlug} /${locale}/${route.targetSlug} ${route.status}`)
        }),
        ...Object.entries(taxonomyRedirects).flatMap(([sourceSlug, targetSlug]) => (
            LOCALES.map((locale) => `/${locale}/${sourceSlug} /${locale}/${targetSlug} 301`)
        )),
    ]
}

export function buildRedirectsSource(
    routes = loadLegacyRoutes(),
    taxonomyRedirects = loadLegacyTaxonomyRedirects(),
    canonicalToolSlugs = loadCanonicalToolSlugs(),
) {
    const lines = buildRedirectLines(routes, taxonomyRedirects, canonicalToolSlugs)

    return `${lines.join("\n")}\n`
}

export function checkGeneratedLegacyRoutes() {
    const routes = loadLegacyRoutes()
    const taxonomyRedirects = loadLegacyTaxonomyRedirects()
    const canonicalToolSlugs = loadCanonicalToolSlugs()
    const expectedAliases = buildToolAliasesSource(routes)
    const expectedRedirects = buildRedirectsSource(routes, taxonomyRedirects, canonicalToolSlugs)
    const problems = []

    if (!fs.existsSync(TOOL_ALIASES_PATH) || readText(TOOL_ALIASES_PATH) !== expectedAliases) {
        problems.push(`stale ${path.relative(ROOT, TOOL_ALIASES_PATH)}`)
    }

    if (!fs.existsSync(REDIRECTS_PATH) || readText(REDIRECTS_PATH) !== expectedRedirects) {
        problems.push(`stale ${path.relative(ROOT, REDIRECTS_PATH)}`)
    }

    if (problems.length > 0) {
        console.error(`[check:legacy-routes] FAILED: ${problems.join(", ")}. Run \`npm run generate:legacy-routes\`.`)
        process.exit(1)
    }

    return { routes, taxonomyRedirects, canonicalToolSlugs }
}

function writeGeneratedFiles() {
    const routes = loadLegacyRoutes()
    const taxonomyRedirects = loadLegacyTaxonomyRedirects()
    const canonicalToolSlugs = loadCanonicalToolSlugs()
    fs.writeFileSync(TOOL_ALIASES_PATH, buildToolAliasesSource(routes))
    fs.writeFileSync(REDIRECTS_PATH, buildRedirectsSource(routes, taxonomyRedirects, canonicalToolSlugs))
    console.log(`[generate:legacy-routes] wrote ${path.relative(ROOT, TOOL_ALIASES_PATH)}`)
    console.log(`[generate:legacy-routes] wrote ${path.relative(ROOT, REDIRECTS_PATH)}`)
}

function main() {
    if (CHECK_ONLY) {
        checkGeneratedLegacyRoutes()
        console.log("[check:legacy-routes] OK: generated legacy route files are up to date")
    } else {
        writeGeneratedFiles()
        checkGeneratedLegacyRoutes()
    }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
    main()
}
