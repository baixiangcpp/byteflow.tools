import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { buildHubMetadata } from "@/core/seo/seo"
import { WorkflowDetailPage } from "@/core/seo/components/workflow-pages"
import { getLocalizedWorkflowCopy, getWorkflowBySlug, type WorkflowSlug } from "@/core/workflows/workflow-hubs"

const WORKFLOW_SLUG = "image-resize-social-export" satisfies WorkflowSlug

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const workflow = getWorkflowBySlug(WORKFLOW_SLUG)
    if (!workflow) {
        notFound()
    }

    const copy = getLocalizedWorkflowCopy(workflow, lang)
    return buildHubMetadata({
        lang,
        slug: `workflows/${workflow.slug}`,
        title: copy.title,
        description: copy.description,
    })
}

export default async function ImageResizeSocialExportWorkflowPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    return <WorkflowDetailPage lang={lang} workflowSlug={WORKFLOW_SLUG} />
}
