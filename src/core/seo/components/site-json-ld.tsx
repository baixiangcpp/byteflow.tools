import { buildSiteJsonLd } from "@/core/seo/seo";
import type { Locale } from "@/core/i18n/i18n";
import { JsonLdScript } from "./json-ld-script";

/**
 * Renders site-level JSON-LD (Organization + WebSite) for the homepage.
 * Should be placed in the root or [lang] layout.
 */
export function SiteJsonLd({ lang }: { lang: Locale }) {
    const schema = buildSiteJsonLd(lang);

    return <JsonLdScript jsonLd={schema} />;
}
