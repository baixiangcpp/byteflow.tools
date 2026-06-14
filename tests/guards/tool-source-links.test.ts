import { existsSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { TOOL_REGISTRY } from "@/core/registry"
import { getRouteSourceToolSlugs, getToolSourceUrl } from "@/core/registry/tool-source"

const REPO_SOURCE_PREFIX = "https://github.com/baixiangcpp/byteflow.tools/blob/main/"

function getSourcePathFromUrl(url: string): string {
    expect(url.startsWith(REPO_SOURCE_PREFIX)).toBe(true)
    return decodeURIComponent(url.slice(REPO_SOURCE_PREFIX.length))
}

describe("tool source links", () => {
    it("points every canonical tool source URL at an existing repository file", () => {
        for (const tool of TOOL_REGISTRY) {
            const sourceUrl = getToolSourceUrl(tool.slug)
            const sourcePath = getSourcePathFromUrl(sourceUrl)

            expect(
                existsSync(sourcePath),
                `${tool.slug} source link points at missing file: ${sourcePath}`,
            ).toBe(true)
        }
    })

    it("points route-backed hash tool source URLs at their route files", () => {
        for (const slug of getRouteSourceToolSlugs()) {
            const sourceUrl = getToolSourceUrl(slug)
            const sourcePath = getSourcePathFromUrl(sourceUrl)

            expect(sourcePath).toBe(`src/app/[lang]/${slug}/page.tsx`)
            expect(
                existsSync(sourcePath),
                `${slug} source link points at missing file: ${sourcePath}`,
            ).toBe(true)
        }
    })
})
