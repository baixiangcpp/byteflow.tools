import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildContentMetadata } from "@/core/seo/seo"

const SLUG = "json-vs-json5-differences"
const TITLE = "JSON vs JSON5 Differences"
const DESCRIPTION = "Compare JSON and JSON5 syntax rules, compatibility risks, and migration checks before using JSON5 in production flows."

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
