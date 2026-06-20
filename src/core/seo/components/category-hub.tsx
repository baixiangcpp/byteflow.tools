import Link from "next/link"
import { requireTranslationValue, type Locale } from "@/core/i18n/i18n"
import { getToolsByCategory, type ToolCategory } from "@/core/registry"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { ArrowRight } from "lucide-react"
import { CollectionPageJsonLd } from "./page-json-ld"

interface CategoryHubProps {
    lang: Locale
    category: ToolCategory
    titleKey: string
    descriptionKey: string
}

/**
 * Shared component for category hub pages (formatters, text-tools, generators, network-tools).
 * Renders a responsive grid of tool cards with localized titles and descriptions.
 */
export function CategoryHub({ lang, category, titleKey, descriptionKey }: CategoryHubProps) {
    const t = getTranslation(lang)
    const tools = getToolsByCategory(category)
    const toolTranslations = t.tools as Record<string, { title?: string; description?: string }>

    const title = requireTranslationValue(t.nav[titleKey as keyof typeof t.nav], `nav.${titleKey}`)
    const description = requireTranslationValue(
        t.categories[descriptionKey as keyof typeof t.categories],
        `categories.${descriptionKey}`,
    )
    const slugByCategory: Record<ToolCategory, string> = {
        formatters: "formatters",
        "text-string": "text-tools",
        generators: "generators",
        "network-web": "network-tools",
    }

    return (
        <div className="flex max-h-full flex-col gap-7 overflow-y-auto pb-8">
            <CollectionPageJsonLd
                lang={lang}
                slug={slugByCategory[category]}
                title={title}
                description={description}
            />
            <header className="rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
                )}
                <p className="mt-3 text-sm text-muted-foreground">
                    {tools.length} {t.common.tools}
                </p>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => {
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
                                <ArrowRight className="w-3 h-3" />
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
