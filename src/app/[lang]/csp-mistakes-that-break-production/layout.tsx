import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildContentMetadata } from "@/core/seo/seo"

const SLUG = "csp-mistakes-that-break-production"
const TITLE = "CSP Mistakes That Break Production"
const DESCRIPTION = "Learn the high-impact CSP mistakes that break scripts, styles, and third-party integrations in production."

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
