import { getToolByKey } from "./registry"
import type { ToolMeta } from "./types"

export function getRelatedTools(toolKey: string): ToolMeta[] {
    const tool = getToolByKey(toolKey)
    if (!tool) return []

    return tool.relatedTools
        .map((key) => getToolByKey(key))
        .filter((entry): entry is ToolMeta => entry !== undefined)
}
