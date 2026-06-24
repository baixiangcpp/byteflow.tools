import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { buildStaticPageMetadata } from "@/core/seo/seo"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    const t = getTranslation(lang)
    return buildStaticPageMetadata({
        lang,
        slug: "roadmap",
        title: t.pages.roadmap_title,
        description: t.pages.roadmap_intro,
    })
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
