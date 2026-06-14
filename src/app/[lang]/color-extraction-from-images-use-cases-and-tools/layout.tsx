import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildContentMetadata } from "@/core/seo/seo"

const SLUG = "color-extraction-from-images-use-cases-and-tools"
const TITLE = "Color Extraction from Images: Use Cases and Tools"
const DESCRIPTION = "Extract and operationalize image color palettes for branding, design systems, and content production workflows."

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
