import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { CATEGORIES, TOOL_FAMILY_LABELS, TOOL_MANIFESTS, TOOL_REGISTRY } from "@/core/registry"
import { getClientToolByKey } from "@/generated/client-tool-lookup"
import {
    assertSimpleToolManifestSource,
    listManifestFiles,
    parseToolManifestFile,
} from "../../scripts/lib/tool-manifest-lib.js"

const ROOT = process.cwd()
const FEATURE_TOOLS_DIR = path.join(ROOT, "src/features/tools")
const APP_ROUTES_DIR = path.join(ROOT, "src/app/[lang]")

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

function featureToolSlugs() {
    return fs
        .readdirSync(FEATURE_TOOLS_DIR, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
}

describe("tool manifests", () => {
    it("keeps every feature tool paired with same-directory page and manifest files", () => {
        const slugs = featureToolSlugs()
        const missingManifests = slugs.filter((slug) => !fs.existsSync(path.join(FEATURE_TOOLS_DIR, slug, "manifest.ts")))
        const missingPages = slugs.filter((slug) => !fs.existsSync(path.join(FEATURE_TOOLS_DIR, slug, "page.tsx")))

        expect(missingManifests).toEqual([])
        expect(missingPages).toEqual([])
    })

    it("parses every manifest with the generator parser", () => {
        const parsed = listManifestFiles().map(parseToolManifestFile)

        expect(parsed).toHaveLength(featureToolSlugs().length)
        expect(parsed.map((manifest) => manifest.slug).sort()).toEqual(featureToolSlugs())
    })

    it("keeps every manifest as a simple metadata object literal", () => {
        const offenders = listManifestFiles().flatMap((manifestPath) => {
            const source = fs.readFileSync(manifestPath, "utf8")
            const relativePath = path.relative(ROOT, manifestPath).replace(/\\/g, "/")
            try {
                assertSimpleToolManifestSource(source, manifestPath)
            } catch (error) {
                return [`${relativePath}: ${error instanceof Error ? error.message : String(error)}`]
            }

            const forbiddenFragments = [
                " from \"@/features/tools/",
                " from '@/features/tools/",
                " from \"@/app/",
                " from '@/app/",
                " from \"react\"",
                " from 'react'",
                "lucide-react",
                "\"use client\"",
            ]
            return forbiddenFragments.some((fragment) => source.includes(fragment)) ? [relativePath] : []
        })

        expect(offenders).toEqual([])
    })

    it("keeps manifest identity unique and aligned with feature directories", () => {
        const validCategories = new Set(Object.keys(CATEGORIES))
        const keys = new Set<string>()
        const slugs = new Set<string>()
        const duplicateKeys: string[] = []
        const duplicateSlugs: string[] = []
        const invalidCategories: string[] = []
        const mismatchedDirectories: string[] = []

        for (const manifest of TOOL_MANIFESTS) {
            if (keys.has(manifest.key)) duplicateKeys.push(manifest.key)
            if (slugs.has(manifest.slug)) duplicateSlugs.push(manifest.slug)
            keys.add(manifest.key)
            slugs.add(manifest.slug)

            if (!validCategories.has(manifest.category)) {
                invalidCategories.push(`${manifest.key}:${manifest.category}`)
            }

            const manifestPath = path.join(FEATURE_TOOLS_DIR, manifest.slug, "manifest.ts")
            const pagePath = path.join(FEATURE_TOOLS_DIR, manifest.slug, "page.tsx")
            const directorySlug = path.basename(path.dirname(manifestPath))
            if (!fs.existsSync(manifestPath) || !fs.existsSync(pagePath) || manifest.slug !== directorySlug) {
                mismatchedDirectories.push(`${manifest.key}:${manifest.slug}`)
            }
        }

        expect(duplicateKeys).toEqual([])
        expect(duplicateSlugs).toEqual([])
        expect(invalidCategories).toEqual([])
        expect(mismatchedDirectories).toEqual([])
    })

    it("keeps related tools pointing at existing tool keys or slugs", () => {
        const keys = new Set(TOOL_MANIFESTS.map((tool) => tool.key))
        const slugs = new Set(TOOL_MANIFESTS.map((tool) => tool.slug))
        const missingReferences = TOOL_MANIFESTS.flatMap((tool) =>
            tool.relatedTools
                .filter((relatedTool) => !keys.has(relatedTool) && !slugs.has(relatedTool))
                .map((relatedTool) => `${tool.key}:${relatedTool}`),
        )

        expect(missingReferences).toEqual([])
    })

    it("builds the public registry from feature manifests without count drift", () => {
        expect(TOOL_REGISTRY).toHaveLength(TOOL_MANIFESTS.length)
        expect(TOOL_REGISTRY.map((tool) => tool.key)).toEqual(TOOL_MANIFESTS.map((tool) => tool.key))
    })

    it("adds practical discovery taxonomy without replacing stable category routes", () => {
        const validFamilies = new Set(Object.keys(TOOL_FAMILY_LABELS))
        const missingTaxonomy = TOOL_REGISTRY
            .filter((tool) => !tool.family || !validFamilies.has(tool.family) || !Array.isArray(tool.tags) || tool.tags.length === 0 || !Array.isArray(tool.capabilities))
            .map((tool) => tool.key)
        const familiesInUse = new Set(TOOL_REGISTRY.map((tool) => tool.family))

        expect(missingTaxonomy).toEqual([])
        expect(familiesInUse.size).toBeGreaterThan(Object.keys(CATEGORIES).length)
        expect(TOOL_REGISTRY.find((tool) => tool.key === "json_formatter")).toMatchObject({
            category: "formatters",
            family: "data-formats",
        })
        expect(TOOL_REGISTRY.find((tool) => tool.key === "pipeline_builder")?.capabilities).toContain("file-input")
    })

    it("keeps server and client taxonomy metadata aligned", () => {
        const drift = TOOL_REGISTRY.flatMap((tool) => {
            const clientTool = getClientToolByKey(tool.key)
            if (!clientTool) return [`${tool.key}:missing-client-entry`]
            const serverTags = tool.tags ?? []
            const serverCapabilities = tool.capabilities ?? []
            if (
                clientTool.family !== tool.family ||
                JSON.stringify(clientTool.tags) !== JSON.stringify(serverTags) ||
                JSON.stringify(clientTool.capabilities) !== JSON.stringify(serverCapabilities)
            ) {
                return [`${tool.key}:taxonomy-drift`]
            }
            return []
        })

        expect(drift).toEqual([])
    })

    it("keeps canonical route wrappers aligned with feature manifests", () => {
        const missingRoutePages = TOOL_MANIFESTS
            .map((tool) => tool.slug)
            .filter((slug) => !fs.existsSync(path.join(APP_ROUTES_DIR, slug, "page.tsx")))

        expect(missingRoutePages).toEqual([])
    })

    it("keeps retired category metadata files as manifest-filter shims", () => {
        const legacySources = [
            "src/core/registry/tool-meta/formatters.ts",
            "src/core/registry/tool-meta/text-string.ts",
            "src/core/registry/tool-meta/generators.ts",
            "src/core/registry/tool-meta/network-web.ts",
        ].map(read)

        for (const source of legacySources) {
            expect(source).toContain("getToolsByCategory")
            expect(source).not.toContain("relatedTools:")
            expect(source).not.toContain("keywords:")
        }
    })
})
