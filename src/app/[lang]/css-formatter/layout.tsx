import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LOCALES, isValidLocale } from "@/core/i18n/i18n"
import { buildToolMetadata } from "@/core/seo/seo"

const SITE_URL = "https://byteflow.tools"
const SLUG = "css-formatter"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang

    const baseMetadata = buildToolMetadata({ lang: locale, slug: "html-css-beautifier" })
    const canonical = `${SITE_URL}/${locale}/${SLUG}`
    const languages = Object.fromEntries([
        ...LOCALES.map((l) => [l, `${SITE_URL}/${l}/${SLUG}`]),
        ["x-default", `${SITE_URL}/en/${SLUG}`],
    ])

    return {
        ...baseMetadata,
        alternates: {
            canonical,
            languages,
        },
        openGraph: {
            ...baseMetadata.openGraph,
            url: canonical,
        },
    }
}

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
