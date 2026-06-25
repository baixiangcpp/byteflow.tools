import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"
import { ServerFooter } from "@/components/layout/server-footer"
import { ServerNavbar } from "@/components/layout/server-navbar"
import { LOCALES, type Locale } from "@/core/i18n/i18n"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { SiteJsonLd } from "@/core/seo/components/site-json-ld"
import { buildDefaultOgImageUrl, buildSiteKeywords } from "@/core/seo/seo"
import { SITE_URL } from "@/core/seo/urls"
import { ToolPrivacyFooterSlot } from "@/features/tool-shell/tool-privacy-footer-slot"
import LocalizedHomePage from "@/app/[lang]/page"

const locale: Locale = "en"
const translations = getTranslation(locale)
const ROOT_OG_IMAGE = buildDefaultOgImageUrl(locale)

const ROOT_ALTERNATES = Object.fromEntries(
    LOCALES.map((supportedLocale) => [
        supportedLocale,
        supportedLocale === locale ? SITE_URL : `${SITE_URL}/${supportedLocale}`,
    ]),
) as Record<string, string>

ROOT_ALTERNATES["x-default"] = SITE_URL

export const metadata: Metadata = {
    title: {
        absolute: translations.site.title,
    },
    description: `${translations.site.description} No signup, no cloud history, and installable as a PWA.`,
    keywords: buildSiteKeywords({ lang: locale, title: translations.site.title }),
    openGraph: {
        title: translations.site.title,
        description: translations.site.description,
        url: SITE_URL,
        siteName: "byteflow.tools",
        type: "website",
        images: [ROOT_OG_IMAGE],
    },
    twitter: {
        card: "summary_large_image",
        title: translations.site.title,
        description: translations.site.description,
        images: [ROOT_OG_IMAGE],
    },
    alternates: {
        canonical: SITE_URL,
        languages: ROOT_ALTERNATES,
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootPage() {
    return (
        <LangProvider lang={locale} translations={translations}>
            <SiteJsonLd lang={locale} />
            <AppLayout
                header={<ServerNavbar lang={locale} translations={translations} />}
                footer={<ServerFooter lang={locale} translations={translations} />}
            >
                <LocalizedHomePage params={Promise.resolve({ lang: locale })} />
                <ToolPrivacyFooterSlot />
            </AppLayout>
        </LangProvider>
    )
}
