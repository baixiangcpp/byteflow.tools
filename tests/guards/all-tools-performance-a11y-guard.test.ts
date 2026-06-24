import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("All Tools performance and accessibility guard", () => {
    it("keeps large All Tools groups progressively disclosed while preserving crawlable links", () => {
        const source = readSource("src/features/tool-discovery/all-tools-discovery.tsx")

        expect(source).toContain("INITIAL_GROUP_TOOL_LIMIT = 6")
        expect(source).toContain("visibleTools = hasOverflowTools && !isExpanded")
        expect(source).toContain("compactTools = hasOverflowTools && !isExpanded")
        expect(source).toContain('data-all-tools-card="true"')
        expect(source).toContain('data-all-tools-compact-link="true"')
        expect(source).toContain("aria-expanded={isExpanded}")
        expect(source).toContain("toggleGroupExpansion(group.key)")
    })

    it("keeps disabled controls explainable and long text contained on mobile", () => {
        const allToolsSource = readSource("src/features/tool-discovery/all-tools-discovery.tsx")
        const globalsSource = readSource("src/app/globals.css")

        expect(allToolsSource).toContain("clearFiltersDisabledDescriptionId")
        expect(allToolsSource).toContain("clearFavoritesDisabledDescriptionId")
        expect(allToolsSource).toContain("clearRecentDisabledDescriptionId")
        expect(allToolsSource).toContain("aria-describedby={!hasFilters ? clearFiltersDisabledDescriptionId : undefined}")
        expect(allToolsSource).toContain("break-words")
        expect(allToolsSource).toContain("max-w-full")
        expect(allToolsSource).toContain("overflow-hidden")
        expect(globalsSource).toContain("min-height: 44px !important")
        expect(globalsSource).toContain("min-width: 44px !important")
    })
})
