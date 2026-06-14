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
        slug: "contact",
        title: t.pages.contact_title,
        description: t.pages.contact_intro,
    });
}
export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
