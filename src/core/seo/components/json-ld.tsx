import { buildBreadcrumbJsonLd } from "@/core/seo/seo";
import { getToolBySlug, type ToolMeta } from "@/core/registry";
import type { Locale } from "@/core/i18n/i18n";

/**
 * Renders BreadcrumbList JSON-LD structured data for a tool page.
 * Path: Home → Category → Tool
 */
export function ToolBreadcrumbJsonLd({ lang, slug }: { lang: Locale; slug: string }) {
    const tool = getToolBySlug(slug);
    if (!tool) return null;

    const jsonLd = buildBreadcrumbJsonLd({ lang, tool });

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}

/**
 * Server-side helper: generate breadcrumb JSON-LD from tool meta.
 * Use this in layout.tsx if you prefer script injection via metadata.
 */
export function getToolBreadcrumbScript(lang: Locale, tool: ToolMeta) {
    return buildBreadcrumbJsonLd({ lang, tool });
}
