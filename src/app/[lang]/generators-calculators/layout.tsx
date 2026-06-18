import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { buildHubMetadata } from "@/core/seo/seo"

const SLUG = "generators-calculators"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const t = getTranslation(lang)

    return buildHubMetadata({
        lang,
        slug: SLUG,
        title: t.nav.generators_calculators,
        description: t.categories.generators_calculators_desc,
    })
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return children
}
