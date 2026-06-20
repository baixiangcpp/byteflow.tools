import { getToolBySlug, type ToolMeta } from "@/core/registry";
import type { Locale } from "@/core/i18n/i18n";
import { JsonLdScript } from "./json-ld-script";
import { buildToolBreadcrumbJsonLd, buildToolJsonLdGraph } from "@/core/seo/jsonld";

/**
 * Renders tool page structured data.
 * Includes WebApplication and BreadcrumbList in a single graph.
 */
export function ToolBreadcrumbJsonLd({ lang, slug }: { lang: Locale; slug: string }) {
    const tool = getToolBySlug(slug);
    if (!tool) return null;

    const jsonLd = buildToolJsonLdGraph({ lang, tool });

    return <JsonLdScript data-jsonld="tool" jsonLd={jsonLd} />;
}

/**
 * Server-side helper: generate breadcrumb JSON-LD from tool meta.
 * Use this in layout.tsx if you prefer script injection via metadata.
 */
export function getToolBreadcrumbScript(lang: Locale, tool: ToolMeta) {
    return buildToolBreadcrumbJsonLd({ lang, tool });
}
