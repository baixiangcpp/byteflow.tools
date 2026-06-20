import { TOOL_MANIFESTS } from "./manifests"
import type { ToolCategory, ToolMeta } from "./types"
import { getToolPrivacyNetworkMetadata } from "./privacy"
import { getToolTaxonomy } from "./tool-taxonomy"

export const TOOL_REGISTRY_ORDER: string[] = TOOL_MANIFESTS.map((tool) => tool.key)

export const TOOL_REGISTRY: ToolMeta[] = TOOL_MANIFESTS.map((tool) => {
    const taxonomy = getToolTaxonomy(tool)
    const privacyNetwork = getToolPrivacyNetworkMetadata(tool.privacy)
    return {
        ...tool,
        ...privacyNetwork,
        family: taxonomy.family,
        tags: taxonomy.tags,
        capabilities: taxonomy.capabilities,
    }
})

export const TOOLS_BY_KEY = new Map<string, ToolMeta>(TOOL_REGISTRY.map((tool) => [tool.key, tool]))

const TOOLS_BY_SLUG = new Map<string, ToolMeta>(TOOL_REGISTRY.map((tool) => [tool.slug, tool]))

export function getToolBySlug(slug: string): ToolMeta | undefined {
    return TOOLS_BY_SLUG.get(slug)
}

export function getToolByKey(key: string): ToolMeta | undefined {
    return TOOLS_BY_KEY.get(key)
}

export function getToolsByCategory(category: ToolCategory): ToolMeta[] {
    return TOOL_REGISTRY.filter((tool) => tool.category === category)
}
