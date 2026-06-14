import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DEFAULT_OG_IMAGE, getOgLocale } from "@/core/seo/seo"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LangNotFoundContent } from "@/components/layout/lang-not-found-content"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const t = getTranslation(lang)
    const title = t.common.not_found_title
    const description = t.common.not_found_description

    return {
        title: { absolute: `${title} | byteflow.tools` },
        description,
        keywords: [title, "404", "byteflow.tools"],
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: `${title} | byteflow.tools`,
            description,
            siteName: "byteflow.tools",
            locale: getOgLocale(lang),
            type: "website",
            images: [DEFAULT_OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title: `${title} | byteflow.tools`,
            description,
            images: [DEFAULT_OG_IMAGE],
        },
    }
}

export default function LangNotFound() {
    return <LangNotFoundContent />
}
