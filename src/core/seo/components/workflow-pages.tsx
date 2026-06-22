import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"
import { requireTranslationValue, type Locale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getToolByKey } from "@/core/registry"
import { SITE_URL, buildCanonicalUrl } from "@/core/seo/urls"
import {
    WORKFLOW_DEFINITIONS,
    getLocalizedWorkflowCopy,
    getTutorialLink,
    getWorkflowBySlug,
    type WorkflowDefinition,
    type WorkflowSlug,
} from "@/core/workflows/workflow-hubs"
import { CollectionPageJsonLd, HowToJsonLd } from "./page-json-ld"
import { JsonLdScript } from "./json-ld-script"

export const WORKFLOW_INDEX_COPY: Record<Locale, { title: string; description: string }> = {
    en: {
        title: "Developer Workflow Hubs",
        description: "Task-oriented paths for cleaning payloads, reviewing tokens, scrubbing logs, and preparing local-first assets.",
    },
    "zh-CN": {
        title: "开发者工作流中心",
        description: "围绕 payload 清理、令牌检查、日志脱敏和本地素材准备的任务路径。",
    },
    "zh-TW": {
        title: "開發者工作流程中心",
        description: "圍繞 payload 清理、權杖檢查、記錄去敏與本地素材準備的任務路徑。",
    },
    ja: {
        title: "開発者ワークフローハブ",
        description: "Payload 整理、トークン確認、ログ消去、ローカル優先の素材準備を行うタスク別導線です。",
    },
    ko: {
        title: "개발자 워크플로 허브",
        description: "Payload 정리, 토큰 검토, 로그 정리, 로컬 우선 자산 준비를 위한 작업 경로입니다.",
    },
    de: {
        title: "Entwickler-Workflow-Hubs",
        description: "Aufgabenorientierte Abläufe für Payload-Bereinigung, Token-Prüfung, Log-Redaktion und lokale Assets.",
    },
    fr: {
        title: "Hubs de workflows développeur",
        description: "Parcours orientés tâche pour nettoyer les payloads, vérifier les tokens, purifier les logs et préparer des assets locaux.",
    },
}

function getToolCopy(lang: Locale, toolKey: string) {
    const t = getTranslation(lang)
    const tool = getToolByKey(toolKey)
    const toolTranslations = t.tools as Record<string, { title?: string; description?: string }>
    const copy = toolTranslations[toolKey]

    return {
        slug: tool?.slug,
        title: requireTranslationValue(copy?.title, `tools.${toolKey}.title`),
        description: requireTranslationValue(copy?.description, `tools.${toolKey}.description`),
    }
}

function WorkflowBreadcrumbJsonLd({
    lang,
    workflow,
}: {
    lang: Locale
    workflow?: WorkflowDefinition
}) {
    const t = getTranslation(lang)
    const indexCopy = WORKFLOW_INDEX_COPY[lang]
    const elements = [
        {
            "@type": "ListItem",
            position: 1,
            name: requireTranslationValue(t.nav.home, "nav.home"),
            item: buildCanonicalUrl(lang),
        },
        {
            "@type": "ListItem",
            position: 2,
            name: indexCopy.title,
            item: buildCanonicalUrl(lang, "workflows"),
        },
    ]

    if (workflow) {
        elements.push({
            "@type": "ListItem",
            position: 3,
            name: getLocalizedWorkflowCopy(workflow, lang).title,
            item: buildCanonicalUrl(lang, `workflows/${workflow.slug}`),
        })
    }

    return (
        <JsonLdScript
            data-jsonld="workflow-breadcrumb"
            jsonLd={{
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: elements,
            }}
        />
    )
}

function WorkflowCard({ workflow, lang }: { workflow: WorkflowDefinition; lang: Locale }) {
    const copy = getLocalizedWorkflowCopy(workflow, lang)

    return (
        <Link
            href={`/${lang}/workflows/${workflow.slug}`}
            className="group flex h-full flex-col justify-between rounded-xl border border-border/70 bg-background/60 p-4 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/35"
        >
            <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">Workflow</p>
                <h2 className="mt-2 text-base font-semibold tracking-tight group-hover:text-primary">{copy.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                Open workflow
                <ArrowRight className="h-3 w-3" />
            </div>
        </Link>
    )
}

export function WorkflowIndexPage({ lang }: { lang: Locale }) {
    const copy = WORKFLOW_INDEX_COPY[lang]

    return (
        <div className="mx-auto w-full max-w-6xl space-y-7">
            <CollectionPageJsonLd lang={lang} slug="workflows" title={copy.title} description={copy.description} />
            <WorkflowBreadcrumbJsonLd lang={lang} />
            <header className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Workflows</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.description}
                </p>
            </header>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Developer workflow pages">
                {WORKFLOW_DEFINITIONS.map((workflow) => (
                    <WorkflowCard key={workflow.slug} workflow={workflow} lang={lang} />
                ))}
            </section>
        </div>
    )
}

export function WorkflowDetailPage({
    lang,
    workflowSlug,
}: {
    lang: Locale
    workflowSlug: WorkflowSlug
}) {
    const workflow = getWorkflowBySlug(workflowSlug)
    if (!workflow) return null

    const copy = getLocalizedWorkflowCopy(workflow, lang)
    const relatedTools = workflow.relatedToolKeys
        .map((toolKey) => ({ toolKey, ...getToolCopy(lang, toolKey) }))
        .filter((tool) => tool.slug)
    const tutorials = workflow.tutorialSlugs
        .map((slug) => getTutorialLink(slug))
        .filter((tutorial): tutorial is NonNullable<typeof tutorial> => Boolean(tutorial))

    return (
        <div className="mx-auto w-full max-w-6xl space-y-7">
            <WorkflowBreadcrumbJsonLd lang={lang} workflow={workflow} />
            <HowToJsonLd
                lang={lang}
                slug={`workflows/${workflow.slug}`}
                title={copy.title}
                description={copy.description}
                steps={workflow.steps.map((step, index) => ({
                    name: step.title,
                    text: step.body,
                    url: `${SITE_URL}/${lang}/workflows/${workflow.slug}#step-${index + 1}`,
                }))}
            />
            <header className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">Workflow</p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.description}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/90">{workflow.scenario}</p>
            </header>

            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <h2 className="text-lg font-semibold tracking-tight">Outcome</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{workflow.outcome}</p>
                </article>
                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <h2 className="text-lg font-semibold tracking-tight">Privacy boundary</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        These workflow pages do not process, collect, or store tool input. Use the linked tools directly and review their trust badges before handling sensitive data.
                    </p>
                </article>
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                <h2 className="text-xl font-semibold tracking-tight">Step-by-step path</h2>
                <ol className="mt-5 grid gap-4">
                    {workflow.steps.map((step, index) => {
                        const tool = getToolCopy(lang, step.toolKey)
                        return (
                            <li
                                key={step.title}
                                id={`step-${index + 1}`}
                                className="grid gap-3 rounded-xl border border-border/70 bg-background/60 p-4 sm:grid-cols-[2.5rem_1fr]"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                                    {index + 1}
                                </span>
                                <div>
                                    <h3 className="text-base font-semibold">{step.title}</h3>
                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                                    {tool.slug ? (
                                        <Link
                                            href={`/${lang}/${tool.slug}`}
                                            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                                        >
                                            {tool.title}
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    ) : null}
                                </div>
                            </li>
                        )
                    })}
                </ol>
            </section>

            <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">Safety notes</h2>
                    </div>
                    <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-muted-foreground">
                        {workflow.safetyNotes.map((note) => (
                            <li key={note} className="flex gap-2">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                <span>{note}</span>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <h2 className="text-lg font-semibold tracking-tight">Tools in this workflow</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {relatedTools.map((tool) => (
                            <Link
                                key={tool.toolKey}
                                href={`/${lang}/${tool.slug}`}
                                className="rounded-xl border border-border/70 bg-card/50 p-3 transition-colors hover:border-primary/35"
                            >
                                <h3 className="text-sm font-semibold">{tool.title}</h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tool.description}</p>
                            </Link>
                        ))}
                    </div>
                </article>
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <h2 className="text-lg font-semibold tracking-tight">Tutorials and checklists</h2>
                    <div className="mt-4 grid gap-3">
                        {tutorials.map((tutorial) => (
                            <Link
                                key={tutorial.slug}
                                href={`/${lang}/${tutorial.slug}`}
                                className="rounded-xl border border-border/70 bg-card/50 p-3 transition-colors hover:border-primary/35"
                            >
                                <h3 className="text-sm font-semibold">{tutorial.title}</h3>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tutorial.description}</p>
                            </Link>
                        ))}
                    </div>
                </article>

                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <h2 className="text-lg font-semibold tracking-tight">Workflow FAQ</h2>
                    <div className="mt-4 grid gap-3">
                        {workflow.faqs.map((faq) => (
                            <div key={faq.question} className="rounded-xl border border-border/70 bg-card/50 p-3">
                                <h3 className="text-sm font-semibold">{faq.question}</h3>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </article>
            </section>
        </div>
    )
}
