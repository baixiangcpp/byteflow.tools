import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildLegacyToolRedirectMetadata, getLegacyToolRedirectCopy } from "@/core/routing/legacy-tool-redirect"
import { LegacyToolRedirectPage } from "@/core/seo/components/legacy-tool-redirect-page"

type PageProps = {
    params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    return buildLegacyToolRedirectMetadata(lang, "csv-json-converter")
}

export default async function CsvToJsonRedirect({ params }: PageProps) {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()

    const copy = getLegacyToolRedirectCopy(lang)
    return (
        <LegacyToolRedirectPage
            href={`/${lang}/csv-json-converter`}
            title={copy.heading}
            body={copy.body}
            cta={copy.cta}
        />
    )
}
