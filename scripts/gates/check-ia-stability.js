#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { BASELINE_PATH, buildIaSnapshot, stableSerialize } from "../lib/ia-stability-lib.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, "../..")
const STALE_COUNT_COPY_PATTERNS = [
    /Six\s+top-level\s+categories/i,
    /6\s*个一级分类/,
    /6\s*個一級分類/,
    /6つの主要カテゴリ/,
    /6개의 상위 카테고리/,
    /Sechs Hauptkategorien/i,
    /Six catégories principales/i,
]

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

const translationDir = path.join(ROOT_DIR, "src/core/i18n/translations")
const staleCopyHits = fs
    .readdirSync(translationDir)
    .filter((file) => file.endsWith(".json"))
    .flatMap((file) => {
        const source = fs.readFileSync(path.join(translationDir, file), "utf8")
        return STALE_COUNT_COPY_PATTERNS
            .filter((pattern) => pattern.test(source))
            .map((pattern) => `${file}: ${pattern}`)
    })

if (staleCopyHits.length > 0) {
    console.error("[check:ia-stability] FAILED: stale category-count copy found.")
    for (const hit of staleCopyHits) console.error(`  - ${hit}`)
    process.exit(1)
}

console.log(
    `[check:ia-stability] OK: ${current.menuGroupHubs.length} menu hubs + ${current.toolCategoryHubs.length} category hubs stable.`
)
