import { buildSiteJsonLd } from "@/core/seo/seo";
import type { Locale } from "@/core/i18n/i18n";

/**
 * Renders site-level JSON-LD (Organization + WebSite) for the homepage.
 * Should be placed in the root or [lang] layout.
 */
export function SiteJsonLd({ lang }: { lang: Locale }) {
    const schema = buildSiteJsonLd(lang);

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
