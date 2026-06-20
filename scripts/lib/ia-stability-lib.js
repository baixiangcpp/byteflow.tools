#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.join(__dirname, "../..")

const TAXONOMY_CONFIG_PATH = path.join(ROOT_DIR, "src/core/registry/tool-taxonomy-config.json")
const TOOL_CATEGORIES_PATH = path.join(ROOT_DIR, "src/core/registry/categories.ts")
const SITEMAP_ROUTE_GROUPS_PATH = path.join(ROOT_DIR, "src/lib/sitemap-route-groups.json")

export const BASELINE_PATH = path.join(ROOT_DIR, "src/lib/ia-stability-baseline.json")

function unique(values) {
    return [...new Set(values)]
}

function stableSort(values) {
    return [...values].sort((a, b) => a.localeCompare(b))
}

function extractMenuGroupHubs() {
    const config = JSON.parse(fs.readFileSync(TAXONOMY_CONFIG_PATH, "utf8"))
    return unique(config.primaryMenuGroupDefs.map((group) => group.slug))
}

function extractToolCategoryHubs() {
    const regex = /labelKey:\s*"[^"]+",\s*slug:\s*"([^"]+)"/g
    const source = fs.readFileSync(TOOL_CATEGORIES_PATH, "utf8")
    const matches = [...source.matchAll(regex)].map((m) => m[1])

    return stableSort(unique(matches))
}

function readSitemapGroups() {
    return JSON.parse(fs.readFileSync(SITEMAP_ROUTE_GROUPS_PATH, "utf8"))
}

export function buildIaSnapshot() {
    const menuGroupHubs = stableSort(extractMenuGroupHubs())
    const toolCategoryHubs = extractToolCategoryHubs()
    const { hubSlugs, staticSlugs } = readSitemapGroups()

    return {
        schemaVersion: 1,
        menuGroupHubs,
        toolCategoryHubs,
        sitemapHubs: stableSort(unique(hubSlugs)),
        requiredPersistentPages: ["about", "contact"],
        sitemapStaticPages: stableSort(unique(staticSlugs)),
    }
}

export function stableSerialize(value) {
    if (Array.isArray(value)) {
        return `[${value.map((v) => stableSerialize(v)).join(",")}]`
    }

    if (value && typeof value === "object") {
        const keys = Object.keys(value).sort()
        return `{${keys.map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`
    }

    return JSON.stringify(value)
}
