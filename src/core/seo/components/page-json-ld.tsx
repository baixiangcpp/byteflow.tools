import type { Locale } from "@/core/i18n/i18n"
import { buildArticleJsonLd, buildCollectionPageJsonLd, buildHowToJsonLd } from "@/core/seo/jsonld"
import { JsonLdScript } from "./json-ld-script"

export function CollectionPageJsonLd({
    lang,
    slug,
    title,
    description,
    items,
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
    return (
        <JsonLdScript
            data-jsonld="collection-page"
            jsonLd={buildCollectionPageJsonLd({ lang, slug, title, description, items })}
        />
    )
}

export function ArticleJsonLd({
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
    return (
        <JsonLdScript
            data-jsonld="article"
            jsonLd={buildArticleJsonLd({ lang, slug, title, description })}
        />
    )
}

export function HowToJsonLd({
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
    return (
        <JsonLdScript
            data-jsonld="how-to"
            jsonLd={buildHowToJsonLd({ lang, slug, title, description, steps })}
        />
    )
}
