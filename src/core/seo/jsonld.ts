import { requireTranslationValue, type Locale } from "@/core/i18n/i18n"
import { CATEGORIES, type ToolMeta } from "@/core/registry"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { SITE_URL, buildCanonicalUrl } from "@/core/seo/urls"

type JsonLdNode = Record<string, unknown>

function stripContext<T extends JsonLdNode>(node: T) {
    const rest = { ...node }
    delete rest["@context"]
    return rest
}

function getToolCopy(lang: Locale, tool: ToolMeta) {
    const t = getTranslation(lang)
    const copy = t.tools as Record<string, { title?: string; description?: string }>
    const toolCopy = copy[tool.key]

    return {
        title: requireTranslationValue(toolCopy?.title, `tools.${tool.key}.title`),
        description: requireTranslationValue(toolCopy?.description, `tools.${tool.key}.description`),
    }
}

export function buildToolWebApplicationJsonLd({
    lang,
    tool,
}: {
    lang: Locale
    tool: ToolMeta
}) {
    const copy = getToolCopy(lang, tool)

    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": `${buildCanonicalUrl(lang, tool.slug)}#web-application`,
        name: copy.title,
        description: copy.description,
        url: buildCanonicalUrl(lang, tool.slug),
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires a modern web browser with JavaScript enabled.",
        isAccessibleForFree: true,
        inLanguage: lang,
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
        },
        publisher: {
            "@id": `${SITE_URL}/#organization`,
        },
    }
}

export function buildToolBreadcrumbJsonLd({
    lang,
    tool,
}: {
    lang: Locale
    tool: ToolMeta
}) {
    const { title } = getToolCopy(lang, tool)
    const category = CATEGORIES[tool.category]
    const t = getTranslation(lang)
    const nav = t.nav as Record<string, string>

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: requireTranslationValue(nav.home, "nav.home"),
                item: buildCanonicalUrl(lang),
            },
            {
                "@type": "ListItem",
                position: 2,
                name: requireTranslationValue(nav[category.labelKey], `nav.${category.labelKey}`),
                item: buildCanonicalUrl(lang, category.slug),
            },
            {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: buildCanonicalUrl(lang, tool.slug),
            },
        ],
    }
}

export function buildToolJsonLdGraph({ lang, tool }: { lang: Locale; tool: ToolMeta }) {
    return {
        "@context": "https://schema.org",
        "@graph": [
            stripContext(buildToolWebApplicationJsonLd({ lang, tool })),
            stripContext(buildToolBreadcrumbJsonLd({ lang, tool })),
        ],
    }
}

export function buildWebsiteJsonLd(lang: Locale) {
    const t = getTranslation(lang)

    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${SITE_URL}/#organization`,
                name: "byteflow.tools",
                url: SITE_URL,
                logo: `${SITE_URL}/icon.png`,
            },
            {
                "@type": "WebSite",
                "@id": `${SITE_URL}/#website`,
                name: "byteflow.tools",
                url: SITE_URL,
                description: t.site.description,
                inLanguage: lang,
                publisher: {
                    "@id": `${SITE_URL}/#organization`,
                },
                potentialAction: {
                    "@type": "SearchAction",
                    target: `${SITE_URL}/${lang}/all-tools?search={search_term_string}`,
                    "query-input": "required name=search_term_string",
                },
            },
        ],
    }
}

export function buildCollectionPageJsonLd({
    lang,
    slug,
    title,
    description,
    items = [],
}: {
    lang: Locale
    slug: string
    title: string
    description: string
    items?: Array<{
        name: string
        url: string
        description?: string
    }>
}) {
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${buildCanonicalUrl(lang, slug)}#collection-page`,
                name: title,
                description,
                url: buildCanonicalUrl(lang, slug),
                inLanguage: lang,
                isPartOf: {
                    "@id": `${SITE_URL}/#website`,
                },
                ...(items.length > 0 ? { mainEntity: { "@id": `${buildCanonicalUrl(lang, slug)}#item-list` } } : {}),
            },
            ...(items.length > 0 ? [{
                "@type": "ItemList",
                "@id": `${buildCanonicalUrl(lang, slug)}#item-list`,
                itemListElement: items.map((item, index) => ({
                    "@type": "ListItem",
                    position: index + 1,
                    name: item.name,
                    url: item.url,
                    ...(item.description ? { description: item.description } : {}),
                })),
            }] : []),
        ],
    }
}

export function buildArticleJsonLd({
    lang,
    slug,
    title,
    description,
}: {
    lang: Locale
    slug: string
    title: string
    description: string
}) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${buildCanonicalUrl(lang, slug)}#article`,
        headline: title,
        description,
        url: buildCanonicalUrl(lang, slug),
        inLanguage: lang,
        publisher: {
            "@id": `${SITE_URL}/#organization`,
        },
        author: {
            "@type": "Organization",
            name: "byteflow.tools",
            url: SITE_URL,
        },
        image: `${SITE_URL}/icon-512.png`,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": buildCanonicalUrl(lang, slug),
        },
    }
}

export function buildHowToJsonLd({
    lang,
    slug,
    title,
    description,
    steps,
}: {
    lang: Locale
    slug: string
    title: string
    description: string
    steps: Array<{
        name: string
        text: string
        url?: string
    }>
}) {
    return {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "@id": `${buildCanonicalUrl(lang, slug)}#how-to`,
        name: title,
        description,
        url: buildCanonicalUrl(lang, slug),
        inLanguage: lang,
        publisher: {
            "@id": `${SITE_URL}/#organization`,
        },
        step: steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.name,
            text: step.text,
            url: step.url ?? `${buildCanonicalUrl(lang, slug)}#step-${index + 1}`,
        })),
    }
}
