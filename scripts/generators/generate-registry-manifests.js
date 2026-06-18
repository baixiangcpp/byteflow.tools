#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
    listManifestFiles,
    loadToolManifestOrder,
    parseToolManifestFile,
    TOOL_MANIFESTS_PATH,
    TOOL_ORDER_PATH,
} from "../lib/tool-manifest-lib.js"

const CHECK_ONLY = process.argv.includes("--check")

function toRepoPath(filePath) {
    return path.relative(process.cwd(), filePath).replace(/\\/g, "/")
}

function slugToManifestIdentifier(slug) {
    return `${slug.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase()).replace(/^[0-9]/, (char) => `_${char}`)}Manifest`
}

function buildRegistryManifestSource() {
    const manifestsBySlug = new Map(listManifestFiles().map((manifestPath) => {
        const manifest = parseToolManifestFile(manifestPath)
        return [manifest.slug, manifest]
    }))
    const order = loadToolManifestOrder()
    const duplicateOrderSlugs = order.filter((slug, index) => order.indexOf(slug) !== index)
    const missingManifestSlugs = order.filter((slug) => !manifestsBySlug.has(slug))
    const orderedSlugSet = new Set(order)
    const unorderedManifestSlugs = [...manifestsBySlug.keys()].filter((slug) => !orderedSlugSet.has(slug)).sort()

    if (duplicateOrderSlugs.length > 0 || missingManifestSlugs.length > 0 || unorderedManifestSlugs.length > 0) {
        const problems = []
        if (duplicateOrderSlugs.length > 0) problems.push(`duplicate slugs in ${toRepoPath(TOOL_ORDER_PATH)}: ${[...new Set(duplicateOrderSlugs)].join(", ")}`)
        if (missingManifestSlugs.length > 0) problems.push(`ordered slugs without manifests: ${missingManifestSlugs.join(", ")}`)
        if (unorderedManifestSlugs.length > 0) problems.push(`manifest slugs missing from ${toRepoPath(TOOL_ORDER_PATH)}: ${unorderedManifestSlugs.join(", ")}`)
        throw new Error(`[generate:registry-manifests] ${problems.join("; ")}`)
    }

    const imports = order.map((slug) => {
        const identifier = slugToManifestIdentifier(slug)
        return `import { toolManifest as ${identifier} } from "@/features/tools/${slug}/manifest"`
    })
    const entries = order.map((slug) => `    ${slugToManifestIdentifier(slug)},`)

    return `${imports.join("\n")}\nimport type { ToolMeta } from "./types"\n\nexport const TOOL_MANIFESTS = [\n${entries.join("\n")}\n] satisfies ToolMeta[]\n`
}

function runCheck(expectedSource) {
    const currentSource = fs.existsSync(TOOL_MANIFESTS_PATH)
        ? fs.readFileSync(TOOL_MANIFESTS_PATH, "utf8")
        : ""

    if (currentSource !== expectedSource) {
        console.error(`[check:registry-manifests] FAILED: ${toRepoPath(TOOL_MANIFESTS_PATH)} is stale. Run npm run generate:registry-manifests.`)
        process.exit(1)
    }

    console.log("[check:registry-manifests] OK")
}

function main() {
    const expectedSource = buildRegistryManifestSource()
    if (!CHECK_ONLY) {
        fs.writeFileSync(TOOL_MANIFESTS_PATH, expectedSource, "utf8")
        console.log(`[generate:registry-manifests] wrote ${toRepoPath(TOOL_MANIFESTS_PATH)}`)
    }
    runCheck(expectedSource)
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
    main()
}

export { buildRegistryManifestSource, runCheck }
