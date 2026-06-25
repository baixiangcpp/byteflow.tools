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
        const componentTestSource = readSource("tests/component/all-tools-discovery.test.tsx")

        expect(source).toContain("INITIAL_GROUP_TOOL_LIMIT = 6")
        expect(source).toContain("visibleTools = hasOverflowTools && !isExpanded")
        expect(source).toContain("compactTools = hasOverflowTools && !isExpanded")
        expect(source).toContain('data-all-tools-card="true"')
        expect(source).toContain('data-all-tools-compact-link="true"')
        expect(source).toContain("aria-expanded={isExpanded}")
        expect(source).toContain("toggleGroupExpansion(group.key)")
        expect(componentTestSource).toContain("LARGE_INVENTORY_TOOL_COUNT = 300")
        expect(componentTestSource).toContain("LARGE_INVENTORY_CARD_BUDGET = 6")
        expect(componentTestSource).toContain("keeps a 300-tool inventory within default and filtered render budgets")
    })

    it("keeps mobile All Tools scroll and filter interaction budgets in browser smoke coverage", () => {
        const smokeSource = readSource("scripts/e2e/run-playwright-smoke.js")

        expect(smokeSource).toContain("ALL_TOOLS_FILTER_INTERACTION_BUDGET_MS")
        expect(smokeSource).toContain("ALL_TOOLS_MOBILE_SCROLL_BUDGET_MS")
        expect(smokeSource).toContain("ALL_TOOLS_MOBILE_MAX_FRAME_DELTA_MS")
        expect(smokeSource).toContain("[data-all-tools-card='true']")
        expect(smokeSource).toContain("[data-all-tools-compact-link='true']")
        expect(smokeSource).toContain("All Tools mobile scroll budget failed")
        expect(smokeSource).toContain("All Tools mobile filter interaction exceeded budget")
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
