import Link from "next/link"
import type { Locale } from "@/core/i18n/i18n"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { getToolBySlug } from "@/core/registry"
import { getRelatedTools } from "@/core/registry/related-tools"
import { JsonLdScript } from "@/core/seo/components/json-ld-script"
import { ToolContentTemplateSurface } from "@/core/seo/components/tool-content-template-surface"
import { getLocalizedWorkflowCopy, getWorkflowsForToolKey } from "@/core/workflows/workflow-hubs"
import { getTemplateCopy } from "./template-copy"
import { resolveFallbackIntentFamily } from "./intent-family"
import type {
    FallbackLocalePack,
    LocaleTemplateProps,
    ToolContentTemplateData,
    ToolContentTemplateEntry,
    ToolTemplateRenderModel,
} from "./types"

export const SEO_CONTENT_TEMPLATE_LOCALES = new Set<Locale>(["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"])
export const FAQ_SCHEMA_TOOL_SLUGS = new Set([
    "json-formatter",
    "jwt-decoder",
    "base64-encode-decode",
    "hash-generator",
    "markdown-preview",
    "image-resizer",
])

export function shouldEmitFaqSchema(toolSlug: string) {
    return FAQ_SCHEMA_TOOL_SLUGS.has(toolSlug)
}

function buildFallbackContentTemplate(
    toolSlug: string,
    t: Record<string, unknown>,
    pack: FallbackLocalePack,
): ToolContentTemplateData | null {
    const tool = getToolBySlug(toolSlug)
    if (!tool) return null

    const toolTranslations = (t.tools || {}) as Record<string, { title?: string; description?: string }>
    const title = requireTranslationValue(toolTranslations[tool.key]?.title, `tools.${tool.key}.title`)
    const description = requireTranslationValue(toolTranslations[tool.key]?.description, `tools.${tool.key}.description`)
    const intent = resolveFallbackIntentFamily(tool.key, tool.slug, tool.category)
    const intentProfile = pack.intentContent?.[intent]

    return {
        toolKey: tool.key,
        intro: `${description} ${pack.introSuffix}`,
        whatThisToolDoes: intentProfile?.whatThisToolDoes(title) ?? pack.whatThisToolDoes(title),
        useCases: intentProfile?.useCases(title) ?? pack.useCases(title),
        inputExamples: intentProfile?.inputExamples ?? pack.inputExamples,
        outputExamples: intentProfile?.outputExamples ?? pack.outputExamples,
        commonErrors: intentProfile?.commonErrors ?? pack.commonErrors,
        privacyNotes: pack.privacyNotes,
        faqs: intentProfile?.faqs(title) ?? pack.faqs(title),
    }
}

export function buildToolTemplateModel({
    toolSlug,
    lang,
    t,
    pack,
    topTemplates,
    localizedTemplates,
}: LocaleTemplateProps & {
    pack: FallbackLocalePack
    topTemplates?: Record<string, ToolContentTemplateData>
    localizedTemplates?: Record<string, ToolContentTemplateEntry>
}): ToolTemplateRenderModel | null {
    const localizedEntry = localizedTemplates?.[toolSlug]
    const content = localizedEntry
        ? localizedEntry.content
        : lang === "en" && topTemplates?.[toolSlug]
            ? topTemplates[toolSlug]
            : buildFallbackContentTemplate(toolSlug, t, pack)

    if (!content) return null

    const toolTranslations = (t.tools || {}) as Record<string, { title?: string; description?: string }>
    const title = requireTranslationValue(toolTranslations[content.toolKey]?.title, `tools.${content.toolKey}.title`)
    const intent = resolveFallbackIntentFamily(content.toolKey, toolSlug, getToolBySlug(toolSlug)?.category || "text-content")
    const intentProfile = localizedEntry ? null : pack.intentContent?.[intent]
    const relatedTools = getRelatedTools(content.toolKey).map((tool) => ({
        slug: tool.slug,
        title: requireTranslationValue(toolTranslations[tool.key]?.title, `tools.${tool.key}.title`),
        description: requireTranslationValue(toolTranslations[tool.key]?.description, `tools.${tool.key}.description`),
    }))
    const relatedWorkflows = getWorkflowsForToolKey(content.toolKey).map((workflow) => {
        const copy = getLocalizedWorkflowCopy(workflow, lang)
        return {
            slug: workflow.slug,
            title: copy.title,
            description: copy.description,
        }
    })

    return {
        toolSlug,
        locale: lang,
        title,
        content,
        copy: getTemplateCopy(lang),
        relatedTools,
        relatedWorkflows,
        workflowSteps: localizedEntry?.workflowSteps ?? intentProfile?.workflow?.(title) ?? pack.workflow(title),
        qualityChecklist: localizedEntry?.qualityChecklist ?? intentProfile?.checklist?.(title) ?? pack.checklist(title),
        operationalNote: localizedEntry?.operationalNote ?? intentProfile?.operational?.(title) ?? pack.operational(title),
    }
}

export function ToolContentTemplateSection({
    model,
    source = "client",
}: {
    model: ToolTemplateRenderModel
    source?: "client" | "server"
}) {
    const faqSchema = shouldEmitFaqSchema(model.toolSlug) ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: model.content.faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.a,
            },
        })),
    } : null

    return (
        <>
            {faqSchema ? <JsonLdScript data-faq-schema="tool" jsonLd={faqSchema} /> : null}
            <ToolContentTemplateSurface source={source}>
                <div className="mx-auto max-w-4xl space-y-8">
                    <header className="space-y-3">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">{model.copy.guideTitle(model.title)}</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">{model.content.intro}</p>
                    </header>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.whatThisToolDoes}</h3>
                        {model.content.whatThisToolDoes.map((line) => (
                            <p key={line} className="text-sm leading-relaxed text-foreground/90">{line}</p>
                        ))}
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.typicalUseCases}</h3>
                        <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
                            {model.content.useCases.map((item) => (
                                <li key={item} className="list-disc pl-1 ml-5">{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.inputExamples}</h3>
                            <div className="space-y-3">
                                {model.content.inputExamples.map((item) => (
                                    <div key={item.label} className="rounded-lg border border-border/60 bg-background/60 p-3">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                                        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">{item.value}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.outputExamples}</h3>
                            <div className="space-y-3">
                                {model.content.outputExamples.map((item) => (
                                    <div key={item.label} className="rounded-lg border border-border/60 bg-background/60 p-3">
                                        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                                        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">{item.value}</pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.commonErrorsAndFixes}</h3>
                        <div className="space-y-3">
                            {model.content.commonErrors.map((item) => (
                                <div key={item.error} className="rounded-lg border border-border/60 bg-background/60 p-3">
                                    <p className="text-sm font-medium text-foreground">{item.error}</p>
                                    <p className="mt-1 text-sm text-muted-foreground">{item.fix}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.securityAndPrivacyNotes}</h3>
                        <p className="text-sm leading-relaxed text-foreground/90">
                            {model.copy.trustCenterPrivacyNote.beforeLink}
                            <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/${model.locale}/trust-center`}>
                                {model.copy.trustCenterPrivacyNote.linkLabel}
                            </Link>
                            {model.copy.trustCenterPrivacyNote.afterLink}
                        </p>
                        <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
                            {model.content.privacyNotes.map((item) => (
                                <li key={item} className="list-disc pl-1 ml-5">{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.stepByStepWorkflow}</h3>
                        <ol className="space-y-2 text-sm leading-relaxed text-foreground/90">
                            {model.workflowSteps.map((item) => (
                                <li key={item} className="list-decimal pl-1 ml-5">{item}</li>
                            ))}
                        </ol>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.qualityChecklistBeforeSharingOutput}</h3>
                        <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
                            {model.qualityChecklist.map((item) => (
                                <li key={item} className="list-disc pl-1 ml-5">{item}</li>
                            ))}
                        </ul>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.operationalNotes}</h3>
                        <p className="text-sm leading-relaxed text-foreground/90">{model.operationalNote}</p>
                    </section>

                    {model.relatedWorkflows.length > 0 ? (
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.relatedWorkflows}</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {model.relatedWorkflows.map((workflow) => (
                                    <Link
                                        key={workflow.slug}
                                        href={`/${model.locale}/workflows/${workflow.slug}`}
                                        className="rounded-lg border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/35"
                                    >
                                        <p className="text-sm font-medium text-foreground">{workflow.title}</p>
                                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{workflow.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {model.relatedTools.length > 0 ? (
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.relatedTools}</h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {model.relatedTools.map((tool) => (
									<Link
										key={tool.slug}
										href={`/${model.locale}/${tool.slug}`}
										className="rounded-lg border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
									>
                                        <p className="text-sm font-medium text-foreground">{tool.title}</p>
                                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">{model.copy.frequentlyAskedQuestions}</h3>
                        <div className="space-y-3">
                            {model.content.faqs.map((item) => (
                                <div key={item.q} className="rounded-lg border border-border/60 bg-background/60 p-3">
                                    <p className="text-sm font-medium text-foreground">{item.q}</p>
                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </ToolContentTemplateSurface>
        </>
    )
}
