#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const ROOT = process.cwd()
const TAXONOMY_PATH = path.join(ROOT, "src/core/analytics/taxonomy.json")
const ANALYTICS_SOURCE_PATH = path.join(ROOT, "src/core/analytics/analytics.ts")
const SRC_ROOT = path.join(ROOT, "src")

const REQUIRED_EVENTS = [
    "tool_loaded",
    "tool_action",
    "copy_output",
    "download_output",
    "search_performed",
    "related_tool_click",
    "pwa_installed",
]

const REQUIRED_ALLOWED_PARAMS = [
    "tool_id",
    "related_tool_id",
    "action_type",
    "language",
    "input_size_bucket",
    "query_length_bucket",
    "results_count",
    "size_bucket",
    "source_page",
    "platform",
]

const REQUIRED_FORBIDDEN_PARAMS = [
    "input",
    "output",
    "payload",
    "token",
    "jwt",
    "secret",
    "url",
    "filename",
    "file_content",
    "image_content",
    "log_body",
    "hash",
    "query",
    "search_query",
    "user_id",
    "session_id",
]

const ALLOWED_TRACK_FUNCTIONS = new Set([
    "trackAllowlistedEvent",
    "trackToolOpen",
    "trackToolRun",
    "trackCopyOutput",
    "trackDownloadOutput",
    "trackSearchPerformed",
    "trackRelatedToolClick",
    "trackPwaInstalled",
])

function read(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required file: ${path.relative(ROOT, filePath)}`)
    }
    return fs.readFileSync(filePath, "utf8")
}

function readJson(filePath) {
    return JSON.parse(read(filePath))
}

function walkFiles(dir) {
    if (!fs.existsSync(dir)) return []
    const files = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if ([".next", "out", "node_modules"].includes(entry.name)) continue
            files.push(...walkFiles(entryPath))
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
            files.push(entryPath)
        }
    }
    return files
}

function addMissing(items, required, label, failures) {
    const set = new Set(items)
    for (const item of required) {
        if (!set.has(item)) failures.push(`${label} missing ${item}`)
    }
}

function checkTaxonomyShape(taxonomy, failures) {
    const eventNames = Object.keys(taxonomy.events ?? {})
    addMissing(eventNames, REQUIRED_EVENTS, "taxonomy.events", failures)
    addMissing(taxonomy.allowedParams ?? [], REQUIRED_ALLOWED_PARAMS, "taxonomy.allowedParams", failures)
    addMissing(taxonomy.forbiddenParams ?? [], REQUIRED_FORBIDDEN_PARAMS, "taxonomy.forbiddenParams", failures)

    const allowedParams = new Set(taxonomy.allowedParams ?? [])
    for (const [eventName, event] of Object.entries(taxonomy.events ?? {})) {
        const eventAllowedParams = event.allowedParams ?? []
        if (!Array.isArray(eventAllowedParams) || eventAllowedParams.length === 0) {
            failures.push(`${eventName} must define allowedParams`)
            continue
        }
        for (const param of eventAllowedParams) {
            if (!allowedParams.has(param)) {
                failures.push(`${eventName} references non-allowlisted param ${param}`)
            }
        }
    }
}

function checkAnalyticsFacade(taxonomy, failures) {
    const source = read(ANALYTICS_SOURCE_PATH)
    const requiredExports = [
        "isAnalyticsEnabled",
        "buildAnalyticsPayload",
        "trackAllowlistedEvent",
        "trackToolOpen",
        "trackToolRun",
        "trackCopyOutput",
        "trackDownloadOutput",
        "trackSearchPerformed",
        "trackRelatedToolClick",
        "trackPwaInstalled",
    ]
    for (const exportName of requiredExports) {
        if (!new RegExp(`export function ${exportName}\\b|export const ${exportName}\\b`).test(source)) {
            failures.push(`analytics.ts missing ${exportName} export`)
        }
    }
    if (!source.includes("export const isAnalyticsEnabled = (): boolean => false")) {
        failures.push("analytics.ts must keep analytics disabled by default")
    }
    for (const eventName of Object.keys(taxonomy.events)) {
        if (!source.includes(`"${eventName}"`)) {
            failures.push(`analytics.ts does not reference allowlisted event ${eventName}`)
        }
    }
    if (/\btrackEvent\b|\btrackCTA\b|\btrackToolUsage\b|\btrackPageView\b|\btrackSeoLanding\b/.test(source)) {
        failures.push("analytics.ts still exposes legacy free-form tracking APIs")
    }
    if (/\bsendBeacon\b|\bfetch\s*\(|document\.cookie|localStorage\.setItem|sessionStorage\.setItem/.test(source)) {
        failures.push("analytics.ts must not send remote requests or persist identifiers")
    }
}

function checkSourceUsage(taxonomy, failures) {
    const forbiddenNames = new Set(taxonomy.forbiddenParams)
    const files = walkFiles(SRC_ROOT)
    const legacyApiPattern = /\btrack(Event|CTA|ToolUsage|PageView|SeoLanding)\s*\(/
    const trackCallPattern = /\b(track[A-Z]\w*)\s*\(([\s\S]*?)\)/g

    for (const filePath of files) {
        const relativePath = path.relative(ROOT, filePath)
        const source = read(filePath)
        if (legacyApiPattern.test(source)) {
            failures.push(`${relativePath} uses a legacy free-form analytics API`)
        }

        for (const match of source.matchAll(trackCallPattern)) {
            const fn = match[1]
            if (!ALLOWED_TRACK_FUNCTIONS.has(fn) && relativePath !== "src/core/analytics/analytics.ts") {
                failures.push(`${relativePath} uses non-allowlisted analytics function ${fn}`)
            }
            const callSource = match[0]
            for (const forbiddenName of forbiddenNames) {
                const pattern = new RegExp(`\\b${forbiddenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`)
                if (pattern.test(callSource) && relativePath !== "src/core/analytics/analytics.ts") {
                    failures.push(`${relativePath} analytics call references forbidden field ${forbiddenName}`)
                }
            }
        }
    }
}

function checkDocumentation(failures) {
    const docs = read(path.join(ROOT, "docs/privacy/analytics-taxonomy.md"))
    for (const eventName of REQUIRED_EVENTS) {
        if (!docs.includes(eventName)) failures.push(`analytics taxonomy docs missing ${eventName}`)
    }
    for (const forbiddenName of ["tool input", "tool output", "search query text", "file names", "file contents"]) {
        if (!docs.toLowerCase().includes(forbiddenName)) failures.push(`analytics taxonomy docs missing forbidden-data phrase: ${forbiddenName}`)
    }
}

function main() {
    const failures = []
    const taxonomy = readJson(TAXONOMY_PATH)

    checkTaxonomyShape(taxonomy, failures)
    checkAnalyticsFacade(taxonomy, failures)
    checkSourceUsage(taxonomy, failures)
    checkDocumentation(failures)

    if (failures.length > 0) {
        console.error(`[check:analytics-taxonomy] ${failures.length} issue(s) found:`)
        for (const failure of failures.slice(0, 120)) {
            console.error(`- ${failure}`)
        }
        if (failures.length > 120) {
            console.error(`... truncated ${failures.length - 120} additional issue(s).`)
        }
        process.exit(1)
    }

    console.log("[check:analytics-taxonomy] OK: allowlisted events, safe parameters, docs, and source usage verified.")
}

main()
