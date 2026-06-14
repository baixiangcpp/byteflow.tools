import Link from "next/link"
import { requireTranslationValue, type Locale } from "@/core/i18n/i18n"
import { getMenuGroupByKey, type MenuGroupKey } from "@/core/registry/menu-groups"
import { getToolByKey } from "@/core/registry"
import { getTextContentHubCopy } from "@/core/seo/text-content-hub-copy"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { ArrowRight } from "lucide-react"

interface MenuGroupHubProps {
    lang: Locale
    groupKey: MenuGroupKey
}

export function MenuGroupHub({ lang, groupKey }: MenuGroupHubProps) {
    const t = getTranslation(lang)
    const group = getMenuGroupByKey(groupKey)
    const textContentCopy = groupKey === "text_content" ? getTextContentHubCopy(lang) : null
    const toolTranslations = t.tools as Record<string, { title?: string; description?: string }>

    if (!group) return null

    const title = requireTranslationValue(t.nav[group.navKey as keyof typeof t.nav], `nav.${group.navKey}`)
    const description = requireTranslationValue(
        t.categories[group.descriptionKey as keyof typeof t.categories],
        `categories.${group.descriptionKey}`,
    )

    return (
        <div className="flex max-h-full flex-col gap-7 overflow-y-auto pb-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                    {group.items.length} {t.common.tools}
                </p>
            </header>

            {textContentCopy && (
                <>
                    <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                        <div className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                                {textContentCopy.eyebrow}
                            </p>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {textContentCopy.intro}
                            </p>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {textContentCopy.detail}
                            </p>
                        </div>

                        <section className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                            <h2 className="text-lg font-semibold tracking-tight">{textContentCopy.highlightsTitle}</h2>
                            <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-muted-foreground">
                                {textContentCopy.highlights.map((item) => (
                                    <li key={item} className="rounded-xl border border-border/60 bg-background/50 px-3 py-2">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </section>

                    <section className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                        <div className="max-w-3xl">
                            <h2 className="text-xl font-semibold tracking-tight">{textContentCopy.workflowsTitle}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                                {textContentCopy.workflowsIntro}
                            </p>
                        </div>
                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {textContentCopy.workflows.map((workflow) => {
                                const tool = getToolByKey(workflow.toolKey)
                                if (!tool) return null

                                const toolT = toolTranslations[tool.key]
                                const toolTitle = requireTranslationValue(toolT?.title, `tools.${tool.key}.title`)

                                return (
                                    <Link
                                        key={workflow.toolKey}
                                        href={`/${lang}/${tool.slug}`}
                                        className="group rounded-2xl border border-border/70 bg-background/45 p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/35"
                                    >
                                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                                            {toolTitle}
                                        </p>
                                        <h3 className="mt-2 text-base font-semibold transition-colors group-hover:text-primary">
                                            {workflow.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {workflow.description}
                                        </p>
                                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                                            {t.common.open}
                                            <ArrowRight className="h-3 w-3" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
                        <section className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                            <h2 className="text-lg font-semibold tracking-tight">{textContentCopy.workflowStepsTitle}</h2>
                            <ol className="mt-4 grid gap-4">
                                {textContentCopy.workflowSteps.map((item, index) => (
                                    <li key={item} className="flex gap-3">
                                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                                            {index + 1}
                                        </span>
                                        <p className="pt-0.5 text-sm leading-relaxed text-muted-foreground">{item}</p>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                            <h2 className="text-lg font-semibold tracking-tight">{textContentCopy.faqTitle}</h2>
                            <div className="mt-4 grid gap-3">
                                {textContentCopy.faqs.map((item) => (
                                    <article key={item.question} className="rounded-xl border border-border/60 bg-background/50 p-4">
                                        <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                                    </article>
                                ))}
                            </div>
                        </section>
                    </section>
                </>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((tool) => {
                    const toolT = toolTranslations[tool.key]
                    const toolTitle = requireTranslationValue(toolT?.title, `tools.${tool.key}.title`)
                    const toolDesc = requireTranslationValue(toolT?.description, `tools.${tool.key}.description`)

                    return (
                        <Link
                            key={tool.key}
                            href={`/${lang}/${tool.slug}`}
                            className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/35"
                        >
                            <div>
                                <h2 className="text-base font-semibold transition-colors group-hover:text-primary">
                                    {toolTitle}
                                </h2>
                                <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
                                    {toolDesc}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                                {t.common.open}
                                <ArrowRight className="h-3 w-3" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
