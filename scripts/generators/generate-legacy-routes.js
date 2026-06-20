import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = process.cwd()
const LEGACY_ROUTES_PATH = path.join(ROOT, "src/core/routing/legacy-routes.json")
const TOOL_ALIASES_PATH = path.join(ROOT, "src/core/registry/tool-aliases.json")
const REDIRECTS_PATH = path.join(ROOT, "public/_redirects")
const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"]
const REDIRECT_STATUSES = new Set([301, 302])
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

export function buildRedirectsSource(routes = loadLegacyRoutes()) {
    const lines = routes.flatMap((route) => {
        if (!REDIRECT_STATUSES.has(route.status)) return []
        return LOCALES.map((locale) => `/${locale}/${route.sourceSlug} /${locale}/${route.targetSlug} ${route.status}`)
    })

    return `${lines.join("\n")}\n`
}

export function checkGeneratedLegacyRoutes() {
    const routes = loadLegacyRoutes()
    const expectedAliases = buildToolAliasesSource(routes)
    const expectedRedirects = buildRedirectsSource(routes)
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

    return routes
}

function writeGeneratedFiles() {
    const routes = loadLegacyRoutes()
    fs.writeFileSync(TOOL_ALIASES_PATH, buildToolAliasesSource(routes))
    fs.writeFileSync(REDIRECTS_PATH, buildRedirectsSource(routes))
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
