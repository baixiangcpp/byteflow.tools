import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LOCALES, isValidLocale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"
import { buildMetadataKeywords, buildToolOgImageUrl, getOgLocale } from "@/core/seo/seo"
import { ToolContentTemplateServer } from "@/core/seo/components/tool-content-template-server"

const SITE_URL = "https://byteflow.tools"
const SLUG = "sha224-digest-generator"
const TITLE = "SHA-224 Digest Generator"
const DESCRIPTION = "Generate SHA-224 digests locally in your browser for checksum and integrity workflows."
const KEYWORDS = ["sha224", "sha-224 hash", "sha224 generator", "online hash tool"]

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const ogImage = buildToolOgImageUrl(locale, SLUG)
    const localized = getLocalizedMetaCopy({
        slug: SLUG,
        locale,
        fallbackTitle: TITLE,
        fallbackDescription: DESCRIPTION,
    })

    const languages: Record<string, string> = {}
    LOCALES.forEach((l) => {
        languages[l] = `${SITE_URL}/${l}/${SLUG}`
    })
    languages["x-default"] = `${SITE_URL}/en/${SLUG}`

    return {
        title: localized.title,
        description: localized.description,
        keywords: buildMetadataKeywords({
            lang: locale,
            routeType: "tool",
            primaryTerm: localized.title,
            fallbackKeywords: KEYWORDS,
        }),
        alternates: {
            canonical: `${SITE_URL}/${locale}/${SLUG}`,
            languages,
        },
        openGraph: {
            title: `${localized.title} | byteflow.tools`,
            description: localized.description,
            url: `${SITE_URL}/${locale}/${SLUG}`,
            siteName: "byteflow.tools",
            locale: getOgLocale(locale),
            type: "website",
            images: [ogImage],
        },
        twitter: {
            card: "summary_large_image",
            title: `${localized.title} | byteflow.tools`,
            description: localized.description,
            images: [ogImage],
        },
    }
}

export default async function Layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang

    return (
        <>
            {children}
            <ToolContentTemplateServer toolSlug="hash-generator" lang={locale} />
        </>
    )
}
