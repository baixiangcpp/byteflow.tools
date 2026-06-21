import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildHubMetadata } from "@/core/seo/seo"
import { WorkflowIndexPage, WORKFLOW_INDEX_COPY } from "@/core/seo/components/workflow-pages"

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const copy = WORKFLOW_INDEX_COPY[lang]
    return buildHubMetadata({
        lang,
        slug: "workflows",
        title: copy.title,
        description: copy.description,
    })
}

export default async function WorkflowsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    return <WorkflowIndexPage lang={lang} />
}
