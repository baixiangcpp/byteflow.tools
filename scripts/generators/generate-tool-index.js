import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const TOOL_ROUTE_ROOT = "src/app/[lang]"
const SITEMAP_ROUTE_GROUPS_PATH = "src/lib/sitemap-route-groups.json"
const TOOL_ALIASES_PATH = "src/core/registry/tool-aliases.json"
const OUTPUT_JSON_PATH = "src/generated/tool-index.json"

const CHECK_ONLY = process.argv.includes("--check")

function readText(filePath) {
    return fs.readFileSync(filePath, "utf8")
}

function ensureDirForFile(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
}

function toRepoPath(filePath) {
    return filePath.replace(/\\/g, "/")
}

function loadToolMetaData() {
    const map = new Map()
    const duplicateKeys = []
    const duplicateSlugs = []
    const slugToKey = new Map()

    const manifests = loadOrderedToolManifests()

    for (const manifest of manifests) {
        const { key, slug } = manifest
        const existing = map.get(key)

        if (existing) {
            duplicateKeys.push({ key, currentSlug: slug, existingSlug: existing.slug })
            continue
        }

        const existingSlugKey = slugToKey.get(slug)
        if (existingSlugKey) {
            duplicateSlugs.push({ slug, currentKey: key, existingKey: existingSlugKey })
            continue
        }

        slugToKey.set(slug, key)
        map.set(key, manifest)
    }

    return { manifests, map, duplicateKeys, duplicateSlugs }
}

function loadRouteGroups() {
    if (!fs.existsSync(SITEMAP_ROUTE_GROUPS_PATH)) {
        return { hubSlugs: new Set(), staticSlugs: new Set() }
    }

    const parsed = JSON.parse(readText(SITEMAP_ROUTE_GROUPS_PATH))
    return {
        hubSlugs: new Set(parsed.hubSlugs || []),
        staticSlugs: new Set(parsed.staticSlugs || []),
    }
}

function loadToolAliases() {
    if (!fs.existsSync(TOOL_ALIASES_PATH)) {
        return new Map()
    }

    const parsed = JSON.parse(readText(TOOL_ALIASES_PATH))
    return new Map(Object.entries(parsed))
}

function loadRouteIndex(registrySlugSet) {
    const routeGroups = loadRouteGroups()
    const toolAliases = loadToolAliases()
    const routeEntries = []
    const aliases = []
    const canonicalRoutePresence = new Map()
    const dirEntries = fs.readdirSync(TOOL_ROUTE_ROOT, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()

    for (const slug of dirEntries) {
        const pagePath = path.join(TOOL_ROUTE_ROOT, slug, "page.tsx")
        const hasPage = fs.existsSync(pagePath)
        const isCanonical = registrySlugSet.has(slug)
        const inHubGroup = routeGroups.hubSlugs.has(slug)
        const inStaticGroup = routeGroups.staticSlugs.has(slug)
        let targetSlug = null

        if (hasPage && !isCanonical) {
            const pageSource = readText(pagePath)
            const mappedAliasTarget = toolAliases.get(slug)
            const targets = Array.from(
                new Set(
                    [...pageSource.matchAll(/from\s+["']\.\.\/([^/"']+)\/page["']/g)]
                        .map((match) => match[1])
                        .filter((candidate) => registrySlugSet.has(candidate)),
                ),
            )
            if (targets.length === 1) {
                targetSlug = targets[0]
                aliases.push({
                    slug,
                    targetSlug,
                    pagePath: toRepoPath(pagePath),
                    inStaticGroup,
                    inHubGroup,
                })
            } else if (typeof mappedAliasTarget === "string" && registrySlugSet.has(mappedAliasTarget)) {
                targetSlug = mappedAliasTarget
                aliases.push({
                    slug,
                    targetSlug,
                    pagePath: toRepoPath(pagePath),
                    inStaticGroup,
                    inHubGroup,
                })
            }
        }

        if (isCanonical) {
            canonicalRoutePresence.set(slug, hasPage)
        }

        const kind = isCanonical
            ? "canonical-tool"
            : targetSlug
                ? "alias-tool"
                : inHubGroup
                    ? "hub"
                    : inStaticGroup
                        ? "static-content"
                        : "unknown"

        routeEntries.push({
            slug,
            hasPage,
            kind,
            targetSlug,
            inHubGroup,
            inStaticGroup,
        })
    }

    return { routeEntries, aliases, canonicalRoutePresence }
}

function buildIndexData() {
    const generatedAt = new Date().toISOString()
    const { manifests, map: metaMap, duplicateKeys, duplicateSlugs } = loadToolMetaData()
    const registryOrder = manifests.map((tool) => tool.key)
    const missingRegistryMetaKeys = registryOrder.filter((key) => !metaMap.has(key))
    const extraMetaKeys = [...metaMap.keys()].filter((key) => !registryOrder.includes(key)).sort()

    const canonicalTools = registryOrder
        .filter((key) => metaMap.has(key))
        .map((key, index) => {
            const tool = metaMap.get(key)
            return {
                index: index + 1,
                key: tool.key,
                slug: tool.slug,
                category: tool.category,
                relatedTools: tool.relatedTools,
                keywords: tool.keywords,
                networkAccess: tool.networkAccess || "none",
                persistInput: tool.persistInput ?? null,
                updatedAt: tool.updatedAt || null,
                sourceFile: tool.sourceFile,
            }
        })

    const registrySlugSet = new Set(canonicalTools.map((tool) => tool.slug))
    const { routeEntries, aliases, canonicalRoutePresence } = loadRouteIndex(registrySlugSet)
    const missingCanonicalRoutes = canonicalTools
        .filter((tool) => !canonicalRoutePresence.get(tool.slug))
        .map((tool) => tool.slug)

    const unknownRouteDirs = routeEntries
        .filter((entry) => entry.kind === "unknown")
        .map((entry) => entry.slug)

    return {
        generatedAt,
        counts: {
            canonicalTools: canonicalTools.length,
            aliasRoutes: aliases.length,
            routeDirs: routeEntries.length,
            unknownRouteDirs: unknownRouteDirs.length,
        },
        canonicalTools,
        aliases,
        routeEntries,
        integrity: {
            duplicateKeys,
            duplicateSlugs,
            missingRegistryMetaKeys,
            extraMetaKeys,
            missingCanonicalRoutes,
            unknownRouteDirs,
        },
    }
}

function writeOutputs(data) {
    ensureDirForFile(OUTPUT_JSON_PATH)
    fs.writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(data, null, 2)}\n`)
}

function runCheck(data) {
    const problems = []
    if (data.integrity.duplicateKeys.length > 0) problems.push(`duplicate key: ${data.integrity.duplicateKeys.length}`)
    if (data.integrity.duplicateSlugs.length > 0) problems.push(`duplicate slug: ${data.integrity.duplicateSlugs.length}`)
    if (data.integrity.missingRegistryMetaKeys.length > 0) problems.push(`missing registry metadata: ${data.integrity.missingRegistryMetaKeys.length}`)
    if (data.integrity.missingCanonicalRoutes.length > 0) problems.push(`missing canonical route pages: ${data.integrity.missingCanonicalRoutes.length}`)
    if (data.integrity.unknownRouteDirs.length > 0) problems.push(`unknown route dirs: ${data.integrity.unknownRouteDirs.length}`)

    if (problems.length > 0) {
        console.error(`[check:tool-index] FAILED: ${problems.join(", ")}`)
        process.exit(1)
    }

    console.log(`[check:tool-index] OK: ${data.counts.canonicalTools} canonical tools, ${data.counts.aliasRoutes} alias routes`)
}

function main() {
    const data = buildIndexData()
    if (!CHECK_ONLY) {
        writeOutputs(data)
        console.log(`[generate:tool-index] wrote ${OUTPUT_JSON_PATH}`)
    }
    runCheck(data)
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
    main()
}

export { runCheck }
