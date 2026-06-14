import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { buildHubMetadata } from "@/core/seo/seo"

const SLUG = "format-validate"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    return buildHubMetadata({
        lang: locale,
        slug: SLUG,
        title: t.nav.format_validate,
        description: t.categories.format_validate_desc,
    })
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
