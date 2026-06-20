import type { ToolCategory } from "./categories"
import type { ToolCapability, ToolFamily } from "./tool-taxonomy"

export type { ToolCategory } from "./categories"
export type { ToolCapability, ToolFamily } from "./tool-taxonomy"

export type ToolNetworkAccess = "none" | "user_requested" | "third_party_api"
export type ToolExternalDataSent = "none" | "user_provided_url" | "derived_url"
export type ToolInputPersistenceMode = true | false | "opt-in"
export type ToolExecutionMode = "browser-local" | "external-request"
export type ToolExternalRequestEndpointType = "none" | "user_provided_url" | "derived_public_asset" | "third_party_api"
export type ToolExternalRequestManifest = {
    required: boolean
    endpointType?: ToolExternalRequestEndpointType
    domains?: string[]
    purposeKey?: string
    userDataSent?: ToolExternalDataSent
    disclosure?: string
    consentRequired?: boolean
}
export type ToolPrivacyManifest = {
    executionMode: ToolExecutionMode
    offlineCapable: boolean
    sensitiveInput: boolean
    externalRequest: ToolExternalRequestManifest
}
export type ToolInputSizePolicy = {
    warnAtBytes?: number
    workerAtBytes?: number
    hardLimitBytes?: number
    streamingSupported?: boolean
}
export type RelatedToolWorkflow = {
    toolKey: string
    reasonKey: string
    handoffSupported?: boolean
}

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
    /** Required runtime privacy manifest used by badges, notices, and gates */
    privacy: ToolPrivacyManifest
    /** Optional structured next-step workflow metadata for richer related-tool UX */
    relatedWorkflows?: RelatedToolWorkflow[]
    /** Lightweight example metadata used by quality gates and discovery surfaces */
    sampleInput?: string
    sampleMode?: string
    /** Input-size thresholds used by performance UI and quality gates */
    inputSizePolicy?: ToolInputSizePolicy
    /** SEO target keywords (English, used for meta keywords) */
    keywords: string[]
    /** Optional deterministic lastmod timestamp used by sitemap */
    updatedAt?: string
    /** Optional search keywords for use-case and multilingual matching in command palette */
    searchKeywords?: string[]
    /** Browser network behavior used by privacy UI and CI guards */
    networkAccess?: ToolNetworkAccess
    /** External hosts this tool may contact or embed from the browser */
    networkHosts?: string[]
    /** Translation key under common.external_network_notice.purposes */
    networkPurposeKey?: string
    /** Whether the tool can request a URL supplied directly by the user */
    allowUserProvidedUrl?: boolean
    /** Whether network activity only starts after an explicit user action */
    requiresExplicitUserAction?: boolean
    /** What kind of data may leave the browser when network access is used */
    externalDataSent?: ToolExternalDataSent
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
