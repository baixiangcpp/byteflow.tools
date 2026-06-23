import fs from "node:fs"
import path from "node:path"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"
import { checkGeneratedLegacyRoutes } from "../generators/generate-legacy-routes.js"

const ROOT = process.cwd()
const APP_ROUTE_ROOT = path.join(ROOT, "src/app/[lang]")
const ROUTE_GROUPS_PATH = path.join(ROOT, "src/lib/sitemap-route-groups.json")
const SITEMAP_CANDIDATES = [
    path.join(ROOT, "out/sitemap.xml"),
    path.join(ROOT, ".next/server/app/sitemap.xml"),
]

function hasRoutePage(slug) {
    return fs.existsSync(path.join(APP_ROUTE_ROOT, slug, "page.tsx"))
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function sitemapContainsSlugUrl(sitemap, slug) {
    return new RegExp(`<loc>https://byteflow\\.tools/(?:${["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"].join("|")})/${slug}</loc>`).test(sitemap)
}

function main() {
    const { routes, taxonomyRedirects } = checkGeneratedLegacyRoutes()
    const canonicalToolSlugs = new Set(loadOrderedToolManifests().map((tool) => tool.slug))
    const routeGroups = readJson(ROUTE_GROUPS_PATH)
    const sitemapRouteSlugs = new Set([
        ...(routeGroups.hubSlugs || []),
        ...(routeGroups.staticSlugs || []),
    ])
    const problems = []

    for (const route of routes) {
        if (canonicalToolSlugs.has(route.sourceSlug)) {
            problems.push(`${route.sourceSlug}: source is still a canonical tool slug`)
        }
        if (sitemapRouteSlugs.has(route.sourceSlug)) {
            problems.push(`${route.sourceSlug}: source is still listed in sitemap route groups`)
        }
        if (!hasRoutePage(route.sourceSlug)) {
            problems.push(`${route.sourceSlug}: missing static fallback route page`)
        }

        if (route.status !== 410) {
            if (!canonicalToolSlugs.has(route.targetSlug) && !hasRoutePage(route.targetSlug)) {
                problems.push(`${route.sourceSlug}: target route does not exist (${route.targetSlug})`)
            }
        }
    }

    for (const [sourceSlug, targetSlug] of Object.entries(taxonomyRedirects)) {
        if (!hasRoutePage(sourceSlug)) {
            problems.push(`${sourceSlug}: missing static fallback route page`)
        }
        if (!hasRoutePage(targetSlug)) {
            problems.push(`${sourceSlug}: taxonomy target route does not exist (${targetSlug})`)
        }
    }

    for (const sitemapPath of SITEMAP_CANDIDATES) {
        if (!fs.existsSync(sitemapPath) || !fs.statSync(sitemapPath).isFile()) continue
        const sitemap = fs.readFileSync(sitemapPath, "utf8")
        for (const route of routes) {
            if (sitemapContainsSlugUrl(sitemap, route.sourceSlug)) {
                problems.push(`${path.relative(ROOT, sitemapPath)} contains legacy source ${route.sourceSlug}`)
            }
        }
        for (const sourceSlug of Object.keys(taxonomyRedirects)) {
            if (sitemapContainsSlugUrl(sitemap, sourceSlug)) {
                problems.push(`${path.relative(ROOT, sitemapPath)} contains legacy taxonomy source ${sourceSlug}`)
            }
        }
    }

    if (problems.length > 0) {
        console.error(`[check:legacy-routes] ${problems.length} issue(s) found:`)
        for (const problem of problems) {
            console.error(`- ${problem}`)
        }
        process.exit(1)
    }

    console.log(`[check:legacy-routes] OK: ${routes.length} legacy route(s) and ${Object.keys(taxonomyRedirects).length} legacy taxonomy route(s) have valid targets, redirects, and sitemap exclusions`)
}

main()
