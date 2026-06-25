import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"
import { ServerFooter } from "@/components/layout/server-footer"
import { ServerNavbar } from "@/components/layout/server-navbar"
import { LangProvider } from "@/core/i18n/lang-provider"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { SITE_URL, buildLocalizedAlternates } from "@/core/seo/urls"
import { SiteJsonLd } from "@/core/seo/components/site-json-ld"
import { ToolPrivacyFooterSlot } from "@/features/tool-shell/tool-privacy-footer-slot"
import LocalizedHomePage from "@/app/[lang]/page"

export const metadata: Metadata = {
    title: {
        absolute: "byteflow.tools | Privacy-first Local Developer Tools",
    },
    description: "Format, convert, generate, and inspect data with 100+ local browser tools for developers. No signup, no server-side processing, open source, and installable as a PWA.",
    alternates: {
        canonical: SITE_URL,
        languages: buildLocalizedAlternates(),
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootPage() {
    const locale = "en"
    const translations = getTranslation(locale)

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
