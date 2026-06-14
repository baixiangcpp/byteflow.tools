import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LOCALES, isValidLocale } from "@/core/i18n/i18n"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"
import { buildMetadataKeywords, buildToolOgImageUrl, getOgLocale } from "@/core/seo/seo"
import { ToolContentTemplateServer } from "@/core/seo/components/tool-content-template-server"

const SITE_URL = "https://byteflow.tools"
const SLUG = "sha512-digest-generator"
const TITLE = "SHA-512 Digest Generator"
const DESCRIPTION = "Generate SHA-512 digests with text, file, HMAC, and batch export workflows in a focused single-algorithm page."
const KEYWORDS = ["sha512 hash", "sha512 generator", "sha512 batch hash", "sha512 hmac"]

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
