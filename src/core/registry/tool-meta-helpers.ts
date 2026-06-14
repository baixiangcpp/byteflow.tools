/**
 * Helper to get tool metadata from registry
 */

import { TOOL_REGISTRY } from "./registry"
import type { ToolMeta } from "./types"

/**
 * Get tool metadata by key
 */
export function getToolMetaByKey(toolKey: string): ToolMeta | undefined {
    return TOOL_REGISTRY.find((tool) => tool.key === toolKey)
}

/**
 * Get tool metadata by slug
 */
export function getToolMetaBySlug(slug: string): ToolMeta | undefined {
    return TOOL_REGISTRY.find((tool) => tool.slug === slug)
}

/**
 * Check if a tool is deprecated
 */
export function isToolDeprecated(toolKey: string): boolean {
    const tool = getToolMetaByKey(toolKey)
    return tool?.deprecated !== undefined
}

/**
 * Get deprecated tools
 */
export function getDeprecatedTools(): ToolMeta[] {
    return TOOL_REGISTRY.filter((tool) => tool.deprecated !== undefined)
}

/**
 * Get active (non-deprecated) tools
 */
export function getActiveTools(): ToolMeta[] {
    return TOOL_REGISTRY.filter((tool) => tool.deprecated === undefined)
}
