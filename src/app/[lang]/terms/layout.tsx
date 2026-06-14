import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/core/i18n/i18n";
import { buildStaticPageMetadata } from "@/core/seo/seo";
import { getTranslation } from "@/core/i18n/translations/catalog";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }
    const locale = lang;
    const t = getTranslation(locale);

    return buildStaticPageMetadata({
        lang: locale,
        slug: "terms",
        title: t.pages.terms_title,
        description: t.pages.terms_use_desc,
        noindex: true,
    });
}
export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
