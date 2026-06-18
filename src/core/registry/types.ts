import type { ToolCategory } from "./categories"
import type { ToolCapability, ToolFamily } from "./tool-taxonomy"

export type { ToolCategory } from "./categories"
export type { ToolCapability, ToolFamily } from "./tool-taxonomy"

export type ToolNetworkAccess = "none" | "user_requested" | "third_party_api"
export type ToolInputPersistenceMode = true | false | "opt-in"

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
    /** Browser network behavior used by privacy UI and CI guards */
    networkAccess?: ToolNetworkAccess
    /** Input payload persistence behavior used by privacy UI and CI guards */
    persistInput?: ToolInputPersistenceMode
    /** Practical discovery family derived from manifest metadata */
    family?: ToolFamily
    /** Generated discovery tags used by all-tools and command palette search */
    tags?: string[]
    /** Generated capability badges used by discovery surfaces */
    capabilities?: ToolCapability[]
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
