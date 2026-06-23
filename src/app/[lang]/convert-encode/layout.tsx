import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { buildHubMetadata } from "@/core/seo/seo"
import { buildCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls"

const SLUG = "convert-encode"
const CANONICAL_SLUG = "all-tools"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    return {
        ...buildHubMetadata({
        lang: locale,
        slug: SLUG,
        title: t.nav.convert_encode,
        description: t.categories.convert_encode_desc,
        }),
        robots: {
            index: false,
            follow: true,
        },
        alternates: {
            canonical: buildCanonicalUrl(locale, CANONICAL_SLUG),
            languages: buildLocalizedAlternates({ slug: CANONICAL_SLUG }),
        },
    }
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
