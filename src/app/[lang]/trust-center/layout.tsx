import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { buildStaticPageMetadata } from "@/core/seo/seo"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    return buildStaticPageMetadata({
        lang: locale,
        slug: "trust-center",
        title: t.pages.trust_center_title,
        description: t.pages.trust_center_intro,
    })
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
