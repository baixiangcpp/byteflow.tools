import type { ToolCategory } from "./categories"

export type { ToolCategory } from "./categories"

/**
 * Tool metadata used by registry, sitemap, SEO, breadcrumbs, and related tools.
 */
export interface ToolMeta {
    /** Unique key matching the translation key in tools.{key} */
    key: string
    /** URL slug - must match the directory name under src/features/tools/{slug}/ */
    slug: string
    /** Category for breadcrumbs and hub pages */
    category: ToolCategory
    /** Related tool keys for internal linking (4-6 recommended) */
    relatedTools: string[]
    /** SEO target keywords (English, used for meta keywords) */
    keywords: string[]
    /** Optional deterministic lastmod timestamp used by sitemap */
    updatedAt?: string
    /** Optional search keywords for use-case and multilingual matching in command palette */
    searchKeywords?: string[]
    /** Optional deprecation metadata - marks tool as deprecated with message and alternatives */
    deprecated?: {
        /** Translation key for deprecation message (optional, falls back to generic message) */
        messageKey?: string
        /** Alternative tool keys to suggest (optional) */
        alternatives?: string[]
        /** Reason code for analytics/tracking */
        reason?: "strategic-refocus" | "low-usage" | "superseded" | "external-dependency"
    }
}
