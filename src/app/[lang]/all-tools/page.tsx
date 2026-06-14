import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { isValidLocale, requireTranslationValue } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { getMenuGroups } from "@/core/registry/menu-groups"

export default async function AllToolsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const locale = lang
    const t = getTranslation(locale)
    const groups = getMenuGroups()
    const toolTranslations = t.tools as Record<string, { title?: string; description?: string }>

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-7 pb-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                    {t.common.all_tools}
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {t.site.explore_by_category_title}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {t.site.explore_by_category_subtitle}
                </p>
            </header>

            <div className="grid gap-5">
                {groups.map((group) => {
                    const title = requireTranslationValue(t.nav[group.navKey], `nav.${group.navKey}`)
                    const description = requireTranslationValue(t.categories[group.descriptionKey], `categories.${group.descriptionKey}`)

                    return (
                        <section key={group.key} className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
                                    <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                                        {description}
                                    </p>
                                </div>
                                <Link
                                    href={`/${locale}/${group.slug}`}
                                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border/75 bg-background/55 px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                >
                                    {t.common.open}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {group.items.map((tool) => {
                                    const toolT = toolTranslations[tool.key]
                                    const toolTitle = requireTranslationValue(toolT?.title, `tools.${tool.key}.title`)
                                    const toolDesc = requireTranslationValue(toolT?.description, `tools.${tool.key}.description`)

                                    return (
                                        <Link
                                            key={tool.key}
                                            href={`/${locale}/${tool.slug}`}
                                            className="group flex min-h-32 flex-col rounded-xl border border-border/70 bg-background/45 p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:hover:shadow-black/35"
                                        >
                                            <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                                {toolTitle}
                                            </h3>
                                            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                                {toolDesc}
                                            </p>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    )
                })}
            </div>
        </div>
    )
}
