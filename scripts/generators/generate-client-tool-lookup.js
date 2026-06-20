#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { loadOrderedToolManifests } from "../lib/tool-manifest-lib.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "../..")
const TAXONOMY_CONFIG_PATH = path.join(ROOT, "src/core/registry/tool-taxonomy-config.json")
const OUTPUT_PATH = path.join(ROOT, "src/generated/client-tool-lookup.ts")
const ROUTE_OUTPUT_PATH = path.join(ROOT, "src/generated/route-tool-lookup.ts")
const COMMAND_SEARCH_OUTPUT_PATH = path.join(ROOT, "src/generated/command-search-index.ts")
const DISCOVERY_OUTPUT_PATH = path.join(ROOT, "src/generated/discovery-tool-index.ts")
const TOOL_INDEX_PATH = path.join(ROOT, "src/generated/tool-index.json")

const taxonomyConfig = JSON.parse(fs.readFileSync(TAXONOMY_CONFIG_PATH, "utf8"))
const FAMILY_BY_TOOL_KEY = taxonomyConfig.familyByToolKey
const PIPELINE_READY_TOOL_KEYS = new Set(taxonomyConfig.pipelineReadyToolKeys)
const TOOL_FAMILIES = new Set([
    "formatters-validators",
    "encoders-decoders",
    "text-strings",
    "data-formats",
    "security-tokens",
    "network-http",
    "devops-logs",
    "generators",
    "images-media",
    "svg-css-visual",
    "social-metadata",
    "workbench-pipeline",
])

function parseMenuGroups() {
    return {
        defs: taxonomyConfig.primaryMenuGroupDefs.map((group) => ({
            key: group.key,
            navKey: group.navKey,
            slug: group.slug,
        })),
        primaryGroupByFamily: taxonomyConfig.primaryGroupByFamily,
    }
}

function classifyToolToMenuGroup(tool, primaryGroupByFamily) {
    const taxonomy = getToolTaxonomy(tool)
    const familyGroup = primaryGroupByFamily[taxonomy.family]
    if (familyGroup) return familyGroup

    if (tool.category === "network-web") return "web_api_network"
    if (tool.category === "formatters") return "data_code_formats"
    if (tool.category === "generators") return "generators_calculators"
    return "text_regex"
}

function assertTaxonomyConfig(orderedTools) {
    const toolKeys = new Set(orderedTools.map((tool) => tool.key))
    const primaryGroupKeys = new Set(taxonomyConfig.primaryMenuGroupDefs.map((group) => group.key))
    const legacyGroupKeys = new Set(taxonomyConfig.legacyMenuGroupDefs.map((group) => group.key))
    const problems = []

    for (const [toolKey, family] of Object.entries(taxonomyConfig.familyByToolKey)) {
        if (!toolKeys.has(toolKey)) problems.push(`familyByToolKey references unknown tool: ${toolKey}`)
        if (!TOOL_FAMILIES.has(family)) problems.push(`familyByToolKey.${toolKey} uses unknown family: ${family}`)
    }

    for (const toolKey of taxonomyConfig.pipelineReadyToolKeys) {
        if (!toolKeys.has(toolKey)) problems.push(`pipelineReadyToolKeys references unknown tool: ${toolKey}`)
    }

    for (const [family, groupKey] of Object.entries(taxonomyConfig.primaryGroupByFamily)) {
        if (!TOOL_FAMILIES.has(family)) problems.push(`primaryGroupByFamily uses unknown family: ${family}`)
        if (!primaryGroupKeys.has(groupKey)) problems.push(`primaryGroupByFamily.${family} uses unknown menu group: ${groupKey}`)
    }

    for (const [toolKey, groupKey] of Object.entries(taxonomyConfig.legacyOverrideGroupByToolKey)) {
        if (!toolKeys.has(toolKey)) problems.push(`legacyOverrideGroupByToolKey references unknown tool: ${toolKey}`)
        if (!legacyGroupKeys.has(groupKey)) problems.push(`legacyOverrideGroupByToolKey.${toolKey} uses unknown legacy group: ${groupKey}`)
    }

    if (problems.length > 0) {
        throw new Error(`[tool-taxonomy-config] ${problems.join("; ")}`)
    }
}

function fallbackFamily(tool) {
    if (tool.category === "formatters") return "formatters-validators"
    if (tool.category === "generators") return "generators"
    if (tool.category === "network-web") return "network-http"
    return "text-strings"
}

function inferKeywordTags(tool) {
    const source = [tool.key, tool.slug, ...tool.keywords, ...(tool.searchKeywords || [])].join(" ").toLowerCase()
    const tags = new Set()
    const addWhen = (tag, patterns) => {
        if (patterns.some((pattern) => source.includes(pattern))) tags.add(tag)
    }

    addWhen("json", ["json", "jq"])
    addWhen("yaml", ["yaml", "yq"])
    addWhen("csv", ["csv"])
    addWhen("xml", ["xml", "saml"])
    addWhen("html", ["html"])
    addWhen("css", ["css"])
    addWhen("svg", ["svg"])
    addWhen("markdown", ["markdown"])
    addWhen("base64", ["base64"])
    addWhen("url", ["url", "uri"])
    addWhen("jwt", ["jwt"])
    addWhen("hash", ["hash", "checksum", "digest", "md5", "sha"])
    addWhen("http", ["http", "header", "curl", "openapi", "request"])
    addWhen("regex", ["regex", "regexp"])
    addWhen("image", ["image", "photo", "png", "jpeg", "webp"])
    addWhen("color", ["color", "palette", "gradient"])
    addWhen("logs", ["log", "har"])
    addWhen("security", ["security", "token", "certificate", "totp", "secret", "saml", "asn.1", "asn1"])

    return [...tags].sort()
}

function uniqueSorted(values) {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

function getToolTaxonomy(tool) {
    const networkAccess = getToolPrivacyNetworkMetadata(tool.privacy).networkAccess || "none"
    const family = FAMILY_BY_TOOL_KEY[tool.key] || fallbackFamily(tool)
    const tags = uniqueSorted([family, ...inferKeywordTags(tool)])
    const capabilities = []

    if (tool.privacy.executionMode === "external-request" || networkAccess !== "none") {
        capabilities.push("external-request")
    } else {
        capabilities.push("browser-local")
    }
    if (tool.privacy.offlineCapable) capabilities.push("offline-capable")
    if (tool.privacy.sensitiveInput || tool.persistInput === false || family === "security-tokens" || family === "devops-logs") {
        capabilities.push("sensitive-input")
    }
    if (PIPELINE_READY_TOOL_KEYS.has(tool.key)) capabilities.push("pipeline-ready")
    if (["data-formats", "images-media", "devops-logs", "workbench-pipeline"].includes(family)) {
        capabilities.push("file-input")
    }
    if (["images-media", "svg-css-visual", "social-metadata"].includes(family)) {
        capabilities.push("visual-output")
    }

    return {
        family,
        tags,
        capabilities: uniqueSorted(capabilities),
    }
}

function getToolPrivacyNetworkMetadata(privacy) {
    if (!privacy.externalRequest.required) {
        return {
            networkAccess: "none",
            networkHosts: [],
            networkPurposeKey: null,
            allowUserProvidedUrl: null,
            requiresExplicitUserAction: null,
            externalDataSent: null,
        }
    }

    return {
        networkAccess: privacy.externalRequest.endpointType === "third_party_api" ? "third_party_api" : "user_requested",
        networkHosts: privacy.externalRequest.domains || [],
        networkPurposeKey: privacy.externalRequest.purposeKey || null,
        allowUserProvidedUrl: privacy.externalRequest.endpointType === "user_provided_url",
        requiresExplicitUserAction: privacy.externalRequest.consentRequired ?? null,
        externalDataSent: privacy.externalRequest.userDataSent || null,
    }
}

function loadAliases() {
    if (!fs.existsSync(TOOL_INDEX_PATH)) return new Map()
    const index = JSON.parse(fs.readFileSync(TOOL_INDEX_PATH, "utf8"))
    return new Map(index.canonicalTools.map((t) => [t.key, t.aliases || []]))
}

function buildGeneratedLookupData() {
    const orderedTools = loadOrderedToolManifests()
    assertTaxonomyConfig(orderedTools)
    const aliasesByKey = loadAliases()

    const entries = orderedTools.map((tool) => {
        const taxonomy = getToolTaxonomy(tool)
        const privacyNetwork = getToolPrivacyNetworkMetadata(tool.privacy)
        const entry = {
            key: tool.key,
            slug: tool.slug,
            keywords: tool.keywords,
            aliases: aliasesByKey.get(tool.key) || [],
            relatedToolKeys: tool.relatedTools,
            relatedWorkflows: tool.relatedWorkflows || [],
            sampleInput: tool.sampleInput || null,
            sampleMode: tool.sampleMode || null,
            inputSizePolicy: tool.inputSizePolicy || null,
            privacy: tool.privacy,
            networkAccess: privacyNetwork.networkAccess,
            networkHosts: privacyNetwork.networkHosts,
            networkPurposeKey: privacyNetwork.networkPurposeKey,
            allowUserProvidedUrl: privacyNetwork.allowUserProvidedUrl,
            requiresExplicitUserAction: privacyNetwork.requiresExplicitUserAction,
            externalDataSent: privacyNetwork.externalDataSent,
            persistInput: tool.persistInput ?? null,
            family: taxonomy.family,
            tags: taxonomy.tags,
            capabilities: taxonomy.capabilities,
        }
        if (tool.searchKeywords) {
            entry.searchKeywords = tool.searchKeywords
        }
        return entry
    })
    const byKey = Object.fromEntries(entries.map((entry) => [entry.key, entry]))
    const bySlug = Object.fromEntries(entries.map((entry) => [entry.slug, entry.key]))
    const { defs, primaryGroupByFamily } = parseMenuGroups()
    const menuGroups = defs.map((group) => ({
        key: group.key,
        navKey: group.navKey,
        hubSlug: group.slug,
        items: orderedTools
            .filter((tool) => classifyToolToMenuGroup(tool, primaryGroupByFamily) === group.key)
            .map((tool) => ({ key: tool.key, slug: tool.slug })),
    }))

    return {
        byKey,
        bySlug,
        entries,
        menuGroups,
    }
}

function buildRouteLookupSource(data = buildGeneratedLookupData()) {
    const routeEntries = Object.fromEntries(
        data.entries.map((tool) => [tool.key, {
            key: tool.key,
            slug: tool.slug,
            privacy: tool.privacy,
            networkAccess: tool.networkAccess,
            networkHosts: tool.networkHosts,
            networkPurposeKey: tool.networkPurposeKey,
            requiresExplicitUserAction: tool.requiresExplicitUserAction,
            externalDataSent: tool.externalDataSent,
        }]),
    )
    const hubSlugs = data.menuGroups.map((group) => group.hubSlug)

    return `/**
 * Generated by scripts/generators/generate-client-tool-lookup.js
 * Do not edit manually.
 */

export type RouteToolLookupEntry = {
    key: string
    slug: string
    privacy: ToolPrivacyManifest
    networkAccess: "none" | "user_requested" | "third_party_api"
    networkHosts: readonly string[]
    networkPurposeKey: string | null
    requiresExplicitUserAction: boolean | null
    externalDataSent: "none" | "user_provided_url" | "derived_url" | null
}

export type ToolPrivacyManifest = {
    executionMode: "browser-local" | "external-request"
    offlineCapable: boolean
    sensitiveInput: boolean
    externalRequest: {
        required: boolean
        endpointType?: "none" | "user_provided_url" | "derived_public_asset" | "third_party_api"
        domains?: readonly string[]
        purposeKey?: string
        userDataSent?: "none" | "user_provided_url" | "derived_url"
        disclosure?: string
        consentRequired?: boolean
    }
}

const ROUTE_TOOL_LOOKUP: Record<string, RouteToolLookupEntry> = ${JSON.stringify(routeEntries, null, 4)}

const ROUTE_TOOL_KEY_BY_SLUG: Record<string, string> = ${JSON.stringify(data.bySlug, null, 4)}

export const ROUTE_MENU_GROUP_HUB_SLUGS: readonly string[] = ${JSON.stringify(hubSlugs, null, 4)}

export function getRouteToolByKey(key: string): RouteToolLookupEntry | undefined {
    return ROUTE_TOOL_LOOKUP[key]
}

export function getRouteToolBySlug(slug: string): RouteToolLookupEntry | undefined {
    const key = ROUTE_TOOL_KEY_BY_SLUG[slug]
    return key ? ROUTE_TOOL_LOOKUP[key] : undefined
}
`
}

function buildCommandSearchIndexSource(data = buildGeneratedLookupData()) {
    const entries = Object.fromEntries(
        data.entries.map((tool) => [tool.key, {
            key: tool.key,
            slug: tool.slug,
            keywords: tool.keywords,
            aliases: tool.aliases,
            searchKeywords: tool.searchKeywords || [],
            family: tool.family,
            tags: tool.tags,
            capabilities: tool.capabilities,
        }]),
    )

    return `/**
 * Generated by scripts/generators/generate-client-tool-lookup.js
 * Do not edit manually.
 */

export type CommandSearchIndexEntry = {
    key: string
    slug: string
    keywords: readonly string[]
    aliases: readonly string[]
    searchKeywords: readonly string[]
    family: string
    tags: readonly string[]
    capabilities: readonly string[]
}

const COMMAND_SEARCH_INDEX: Record<string, CommandSearchIndexEntry> = ${JSON.stringify(entries, null, 4)}

export function getCommandSearchToolByKey(key: string): CommandSearchIndexEntry | undefined {
    return COMMAND_SEARCH_INDEX[key]
}
`
}

function buildDiscoveryToolIndexSource(data = buildGeneratedLookupData()) {
    const entries = Object.fromEntries(
        data.entries.map((tool) => [tool.key, {
            key: tool.key,
            slug: tool.slug,
            relatedToolKeys: tool.relatedToolKeys,
            relatedWorkflows: tool.relatedWorkflows,
            sampleInput: tool.sampleInput,
            sampleMode: tool.sampleMode,
            inputSizePolicy: tool.inputSizePolicy,
            family: tool.family,
            tags: tool.tags,
            capabilities: tool.capabilities,
        }]),
    )

    return `/**
 * Generated by scripts/generators/generate-client-tool-lookup.js
 * Do not edit manually.
 */

export type DiscoveryToolIndexEntry = {
    key: string
    slug: string
    relatedToolKeys: readonly string[]
    relatedWorkflows: ReadonlyArray<{ toolKey: string; reasonKey: string; handoffSupported?: boolean }>
    sampleInput: string | null
    sampleMode: string | null
    inputSizePolicy: Readonly<{ warnAtBytes?: number; workerAtBytes?: number; hardLimitBytes?: number; streamingSupported?: boolean }> | null
    family: string
    tags: readonly string[]
    capabilities: readonly string[]
}

export type DiscoveryMenuGroup = {
    key: string
    navKey: string
    hubSlug: string
    items: ReadonlyArray<{ key: string; slug: string }>
}

const DISCOVERY_TOOL_INDEX: Record<string, DiscoveryToolIndexEntry> = ${JSON.stringify(entries, null, 4)}

export const DISCOVERY_MENU_GROUPS: ReadonlyArray<DiscoveryMenuGroup> = ${JSON.stringify(data.menuGroups, null, 4)}

export function getDiscoveryToolByKey(key: string): DiscoveryToolIndexEntry | undefined {
    return DISCOVERY_TOOL_INDEX[key]
}

export function getDiscoveryRelatedTools(toolKey: string): DiscoveryToolIndexEntry[] {
    const tool = DISCOVERY_TOOL_INDEX[toolKey]
    if (!tool) return []

    return tool.relatedToolKeys
        .map((key) => DISCOVERY_TOOL_INDEX[key])
        .filter((entry): entry is DiscoveryToolIndexEntry => Boolean(entry))
}
`
}

function buildClientLookupSource(data = buildGeneratedLookupData()) {
    const byKey = Object.fromEntries(
        data.entries.map((tool) => [tool.key, tool]),
    )

    return `/**
 * Generated by scripts/generators/generate-client-tool-lookup.js
 * Do not edit manually.
 */

export type ClientToolLookupEntry = {
    key: string
    slug: string
    keywords: readonly string[]
    aliases: readonly string[]
    relatedToolKeys: readonly string[]
    relatedWorkflows: ReadonlyArray<{ toolKey: string; reasonKey: string; handoffSupported?: boolean }>
    sampleInput: string | null
    sampleMode: string | null
    inputSizePolicy: Readonly<{ warnAtBytes?: number; workerAtBytes?: number; hardLimitBytes?: number; streamingSupported?: boolean }> | null
    privacy: ToolPrivacyManifest
    networkAccess: "none" | "user_requested" | "third_party_api"
    networkHosts: readonly string[]
    networkPurposeKey: string | null
    allowUserProvidedUrl: boolean | null
    requiresExplicitUserAction: boolean | null
    externalDataSent: "none" | "user_provided_url" | "derived_url" | null
    persistInput: true | false | "opt-in" | null
    family: string
    tags: readonly string[]
    capabilities: readonly string[]
    searchKeywords?: readonly string[]
}

export type ToolPrivacyManifest = {
    executionMode: "browser-local" | "external-request"
    offlineCapable: boolean
    sensitiveInput: boolean
    externalRequest: {
        required: boolean
        endpointType?: "none" | "user_provided_url" | "derived_public_asset" | "third_party_api"
        domains?: readonly string[]
        purposeKey?: string
        userDataSent?: "none" | "user_provided_url" | "derived_url"
        disclosure?: string
        consentRequired?: boolean
    }
}

export type ClientMenuGroup = {
    key: string
    navKey: string
    hubSlug: string
    items: ReadonlyArray<{ key: string; slug: string }>
}

const CLIENT_TOOL_LOOKUP: Record<string, ClientToolLookupEntry> = ${JSON.stringify(byKey, null, 4)}

const CLIENT_TOOL_KEY_BY_SLUG: Record<string, string> = ${JSON.stringify(data.bySlug, null, 4)}

export const CLIENT_MENU_GROUPS: ReadonlyArray<ClientMenuGroup> = ${JSON.stringify(data.menuGroups, null, 4)}

export function getClientToolByKey(key: string): ClientToolLookupEntry | undefined {
    return CLIENT_TOOL_LOOKUP[key]
}

export function getClientToolBySlug(slug: string): ClientToolLookupEntry | undefined {
    const key = CLIENT_TOOL_KEY_BY_SLUG[slug]
    return key ? CLIENT_TOOL_LOOKUP[key] : undefined
}

export function getClientRelatedTools(toolKey: string): ClientToolLookupEntry[] {
    const tool = CLIENT_TOOL_LOOKUP[toolKey]
    if (!tool) return []

    return tool.relatedToolKeys
        .map((key) => CLIENT_TOOL_LOOKUP[key])
        .filter((entry): entry is ClientToolLookupEntry => Boolean(entry))
}
`
}

function buildGeneratedOutputs() {
    const data = buildGeneratedLookupData()
    return [
        {
            path: OUTPUT_PATH,
            source: `${buildClientLookupSource(data).trim()}\n`,
        },
        {
            path: ROUTE_OUTPUT_PATH,
            source: `${buildRouteLookupSource(data).trim()}\n`,
        },
        {
            path: COMMAND_SEARCH_OUTPUT_PATH,
            source: `${buildCommandSearchIndexSource(data).trim()}\n`,
        },
        {
            path: DISCOVERY_OUTPUT_PATH,
            source: `${buildDiscoveryToolIndexSource(data).trim()}\n`,
        },
    ]
}

const nextOutputs = buildGeneratedOutputs()

if (process.argv.includes("--check")) {
    const staleOutputs = nextOutputs
        .filter((output) => !fs.existsSync(output.path) || fs.readFileSync(output.path, "utf8") !== output.source)
        .map((output) => path.relative(ROOT, output.path).replace(/\\/g, "/"))
    if (staleOutputs.length > 0) {
        console.error("[check:client-tool-lookup] Found stale generated tool lookup files. Run `npm run generate:client-tool-lookup`.")
        for (const staleOutput of staleOutputs) {
            console.error(`- ${staleOutput}`)
        }
        process.exit(1)
    }

    console.log("[check:client-tool-lookup] OK: generated tool lookup files are up to date.")
    process.exit(0)
}

for (const output of nextOutputs) {
    fs.writeFileSync(output.path, output.source)
}
console.log("[generate:client-tool-lookup] OK: refreshed generated tool lookup files")
