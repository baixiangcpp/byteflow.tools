import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildContentMetadata } from "@/core/seo/seo"

const SLUG = "robots-txt-testing-checklist"
const TITLE = "Robots.txt Testing Checklist"
const DESCRIPTION = "Use this robots.txt testing checklist to avoid accidental crawl blocks during releases and migrations."

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang

    return buildContentMetadata({
        lang: locale,
        slug: SLUG,
        title: TITLE,
        description: DESCRIPTION,
    })
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
