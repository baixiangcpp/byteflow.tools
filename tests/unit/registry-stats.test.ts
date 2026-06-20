import { describe, expect, it } from "vitest"
import { TOOL_REGISTRY } from "@/core/registry"
import { getMenuGroups } from "@/core/registry/menu-groups"
import { formatToolRegistryStatsTemplate, getToolRegistryStats } from "@/core/registry/stats"

describe("tool registry stats", () => {
    it("uses the registry as the single source for total tools and primary category counts", () => {
        const stats = getToolRegistryStats()
        const menuGroups = getMenuGroups()

        expect(stats.totalTools).toBe(TOOL_REGISTRY.length)
        expect(stats.primaryCategoryCount).toBe(menuGroups.length)
    })

    it("derives per-category and tag counts from registry metadata", () => {
        const stats = getToolRegistryStats()
        const expectedCategoryCounts = new Map(
            getMenuGroups().map((group) => [group.key, group.items.length]),
        )
        const expectedTagCounts = new Map<string, number>()

        for (const tool of TOOL_REGISTRY) {
            for (const tag of tool.tags ?? []) {
                expectedTagCounts.set(tag, (expectedTagCounts.get(tag) ?? 0) + 1)
            }
        }

        expect(new Map(stats.categories.map((category) => [category.key, category.toolCount]))).toEqual(
            expectedCategoryCounts,
        )
        expect(new Map(stats.tags.map((tag) => [tag.tag, tag.toolCount]))).toEqual(expectedTagCounts)
    })

    it("formats count-backed copy without hardcoding registry totals", () => {
        const stats = getToolRegistryStats()

        expect(formatToolRegistryStatsTemplate("{toolCount} tools across {categoryCount} categories", stats)).toBe(
            `${stats.totalTools} tools across ${stats.primaryCategoryCount} categories`,
        )
    })
})
