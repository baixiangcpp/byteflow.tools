#!/usr/bin/env node

import fs from "node:fs"
import { BASELINE_PATH, buildIaSnapshot, stableSerialize } from "../lib/ia-stability-lib.js"

function diffMissing(required, actual) {
    const actualSet = new Set(actual)
    return required.filter((item) => !actualSet.has(item))
}

if (!fs.existsSync(BASELINE_PATH)) {
    console.error(`[check:ia-stability] FAILED: missing baseline ${BASELINE_PATH}`)
    console.error("[check:ia-stability] Run: npm run generate:ia-baseline")
    process.exit(1)
}

const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
const current = buildIaSnapshot()

const missingMenuHubs = diffMissing(current.menuGroupHubs, current.sitemapHubs)
if (missingMenuHubs.length > 0) {
    console.error(`[check:ia-stability] FAILED: sitemap hubSlugs missing menu hubs: ${missingMenuHubs.join(", ")}`)
    process.exit(1)
}

const missingCategoryHubs = diffMissing(current.toolCategoryHubs, current.sitemapHubs)
if (missingCategoryHubs.length > 0) {
    console.error(`[check:ia-stability] FAILED: sitemap hubSlugs missing category hubs: ${missingCategoryHubs.join(", ")}`)
    process.exit(1)
}

const missingStaticPages = diffMissing(current.requiredPersistentPages, current.sitemapStaticPages)
if (missingStaticPages.length > 0) {
    console.error(`[check:ia-stability] FAILED: sitemap staticSlugs missing required pages: ${missingStaticPages.join(", ")}`)
    process.exit(1)
}

if (stableSerialize(baseline) !== stableSerialize(current)) {
    console.error("[check:ia-stability] FAILED: IA baseline changed.")
    console.error("[check:ia-stability] Run: npm run generate:ia-baseline and commit the baseline update intentionally.")
    process.exit(1)
}

console.log(
    `[check:ia-stability] OK: ${current.menuGroupHubs.length} menu hubs + ${current.toolCategoryHubs.length} category hubs stable.`
)
