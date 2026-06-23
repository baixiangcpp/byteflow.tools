import type { Locale } from "@/core/i18n/i18n"
import { SITE_URL, buildCanonicalUrl } from "@/core/seo/urls"
import legacyTaxonomyRedirects from "./legacy-taxonomy-redirects.json"

export { SITE_URL }

export const LEGACY_TAXONOMY_REDIRECTS = legacyTaxonomyRedirects as Readonly<Record<string, string>>

export const LEGACY_TAXONOMY_SLUGS = Object.keys(LEGACY_TAXONOMY_REDIRECTS)

const ALL_TOOLS_INDEX_QUERY_KEYS = new Set(["search", "category", "execution", "family", "input", "tag", "tags", "capability", "use", "useCase"])

export function getLegacyTaxonomyTarget(slug: string): string | null {
    return LEGACY_TAXONOMY_REDIRECTS[slug] ?? null
}

export function buildLocalizedPath(locale: Locale, slug?: string | null): string {
    return new URL(buildCanonicalUrl(locale, slug), SITE_URL).pathname
}

export function isAllToolsIndexableSearchParams(params: URLSearchParams): boolean {
    for (const key of params.keys()) {
        if (ALL_TOOLS_INDEX_QUERY_KEYS.has(key)) return false
    }
    return true
}

export function shouldNoindexAllToolsUrl(url: string): boolean {
    try {
        const parsed = new URL(url, SITE_URL)
        return !isAllToolsIndexableSearchParams(parsed.searchParams)
    } catch {
        return false
    }
}
