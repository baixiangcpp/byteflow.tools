import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildContentMetadata } from "@/core/seo/seo"

const SLUG = "modern-css-effects-guide"
const TITLE = "Modern CSS Effects: Glassmorphism, Gradients, and More"
const DESCRIPTION = "Apply modern CSS effects with practical constraints for readability, performance, and maintainability."

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
