import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isValidLocale } from "@/core/i18n/i18n";
import { buildToolMetadata } from "@/core/seo/seo";
import { ToolBreadcrumbJsonLd } from "@/core/seo/components/json-ld";
import { ToolContentTemplateServer } from "@/core/seo/components/tool-content-template-server";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }

    return buildToolMetadata({ lang, slug: "asn1-der-inspector" });
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    if (!isValidLocale(lang)) {
        notFound();
    }

    return (
        <>
            <ToolBreadcrumbJsonLd lang={lang} slug="asn1-der-inspector" />
            {children}
            <ToolContentTemplateServer toolSlug="asn1-der-inspector" lang={lang} />
        </>
    );
}
