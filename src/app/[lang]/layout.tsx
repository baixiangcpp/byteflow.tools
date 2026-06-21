import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LOCALES, isValidLocale } from "@/core/i18n/i18n";
import { AppLayout } from "@/components/layout/app-layout";
import { ServerFooter } from "@/components/layout/server-footer";
import { ServerNavbar } from "@/components/layout/server-navbar";
import { LangProvider } from "@/core/i18n/lang-provider";
import { SiteJsonLd } from "@/core/seo/components/site-json-ld";
import { buildDefaultOgImageUrl, buildSiteKeywords, getOgLocale } from "@/core/seo/seo";
import { buildCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls";
import { getEnglishToolSearchAliases, getTranslation } from "@/core/i18n/translations/catalog";
import { ToolPrivacyFooterSlot } from "@/features/tool-shell/tool-privacy-footer-slot";

export const dynamicParams = false;

export function generateStaticParams() {
    return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }

    const locale = lang;
    const t = getTranslation(locale);

    const canonicalUrl = buildCanonicalUrl(locale);
    const ogImage = buildDefaultOgImageUrl(locale);

    return {
        title: { default: t.site.title, template: `%s | byteflow.tools` },
        description: t.site.description,
        keywords: buildSiteKeywords({ lang: locale, title: t.site.title }),
        openGraph: {
            title: t.site.title,
            description: t.site.description,
            url: canonicalUrl,
            siteName: "byteflow.tools",
            locale: getOgLocale(locale),
            type: "website",
            images: [ogImage],
        },
        twitter: {
            card: "summary_large_image",
            title: t.site.title,
            description: t.site.description,
            images: [ogImage],
        },
        alternates: {
            canonical: canonicalUrl,
            languages: buildLocalizedAlternates(),
        },
    };
}

export default async function LangLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }

    const locale = lang;
    const translations = getTranslation(locale);
    const englishToolSearchAliases = locale === "en" ? undefined : getEnglishToolSearchAliases();

    return (
        <LangProvider
            lang={locale}
            translations={translations}
            englishToolSearchAliases={englishToolSearchAliases}
        >
            <SiteJsonLd lang={locale} />
            <AppLayout
                header={<ServerNavbar lang={locale} translations={translations} />}
                footer={<ServerFooter lang={locale} translations={translations} />}
            >
                {children}
                <ToolPrivacyFooterSlot />
            </AppLayout>
        </LangProvider>
    );
}
