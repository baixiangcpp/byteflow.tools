import { getMenuGroups, type PrimaryMenuGroupKey } from "./menu-groups"
import { TOOL_REGISTRY } from "./registry"

export type ToolCategoryCount = {
    key: PrimaryMenuGroupKey
    slug: string
    toolCount: number
}

export type ToolTagCount = {
    tag: string
    toolCount: number
}

export type ToolRegistryStats = {
    totalTools: number
    primaryCategoryCount: number
    categories: ToolCategoryCount[]
    tags: ToolTagCount[]
}

let cachedStats: ToolRegistryStats | undefined

export function getToolRegistryStats(): ToolRegistryStats {
    if (cachedStats) return cachedStats

    const categories = getMenuGroups().map((group) => ({
        key: group.key as PrimaryMenuGroupKey,
        slug: group.slug,
        toolCount: group.items.length,
    }))
    const tagCounts = new Map<string, number>()

    for (const tool of TOOL_REGISTRY) {
        for (const tag of tool.tags ?? []) {
            tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1)
        }
    }

    cachedStats = {
        totalTools: TOOL_REGISTRY.length,
        primaryCategoryCount: categories.length,
        categories,
        tags: Array.from(tagCounts, ([tag, toolCount]) => ({ tag, toolCount })).sort(
            (left, right) => right.toolCount - left.toolCount || left.tag.localeCompare(right.tag),
        ),
    }

    return cachedStats
}

export function formatToolRegistryStatsTemplate(template: string, stats: ToolRegistryStats = getToolRegistryStats()) {
    return template
        .replaceAll("{toolCount}", String(stats.totalTools))
        .replaceAll("{categoryCount}", String(stats.primaryCategoryCount))
}
