import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LegacyToolRedirectPage } from "@/core/seo/components/legacy-tool-redirect-page"
import { buildLegacyToolRedirectMetadata, getLegacyToolRedirectCopy } from "@/core/routing/legacy-tool-redirect"
import { isValidLocale } from "@/core/i18n/i18n"

type PageProps = {
    params: Promise<{ lang: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    return buildLegacyToolRedirectMetadata(lang, "crontab-generator")
}

/**
 * Redirect page for legacy/alternative cron-expression-generator URL.
 * This tool is actually named "crontab-generator" but users may search for "cron expression generator".
 */
export default async function CronExpressionGeneratorRedirect({ params }: PageProps) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const target = `/${lang}/crontab-generator`
    const copy = getLegacyToolRedirectCopy(lang)

    return (
        <LegacyToolRedirectPage
            href={target}
            title={copy.heading}
            body={copy.body}
            cta={copy.cta}
        />
    )
}
