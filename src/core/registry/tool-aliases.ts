import toolAliases from "./tool-aliases.json"

// Static export keeps legacy entry routes as thin redirect pages. This map is the
// single source of truth for those old-to-new slug relationships.
export const TOOL_ALIAS_TO_CANONICAL_SLUG: Record<string, string> = toolAliases

export function resolveCanonicalToolSlug(slug: string): string {
    return TOOL_ALIAS_TO_CANONICAL_SLUG[slug] || slug
}
