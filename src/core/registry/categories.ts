/**
 * Tool category definitions for sidebar, hubs, and breadcrumbs.
 */
export type ToolCategory = "formatters" | "text-string" | "generators" | "network-web"

export const CATEGORIES: Record<ToolCategory, { labelKey: string; slug: string }> = {
    formatters: { labelKey: "formatters", slug: "formatters" },
    "text-string": { labelKey: "text_string", slug: "text-tools" },
    generators: { labelKey: "generators", slug: "generators" },
    "network-web": { labelKey: "network_web", slug: "network-tools" },
}
