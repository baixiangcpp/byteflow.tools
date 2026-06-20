"use client"

import Link from "next/link"
import { useLang } from "@/core/i18n/lang-provider"
import { getDiscoveryRelatedTools } from "@/generated/discovery-tool-index"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { ArrowRight } from "lucide-react"

/**
 * Displays 4-6 related tool cards at the bottom of a tool page.
 * Driven by the relatedTools array in each tool manifest.
 */
export function RelatedTools({
    toolKey,
    source = "inline",
}: {
    toolKey: string
    source?: "inline" | "fallback"
}) {
    const { t, lang } = useLang()
    const related = getDiscoveryRelatedTools(toolKey)

    if (related.length === 0) return null

    return (
        <div data-related-tools-source={source} className="mt-10 rounded-2xl border border-border/70 bg-card/55 p-4 backdrop-blur-sm sm:p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {t.nav.related_tools}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((tool) => {
                    const toolTranslation = t.tools?.[tool.key]
                    const title = requireTranslationValue(toolTranslation?.title, `tools.${tool.key}.title`)
                    const desc = requireTranslationValue(toolTranslation?.description, `tools.${tool.key}.description`)

                    return (
                        <Link
                            key={tool.key}
                            href={`/${lang}/${tool.slug}`}
                            className="group flex items-start gap-3 rounded-xl border border-border/70 bg-background/55 p-3 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/30 hover:bg-accent/40"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                                    {title}
                                </div>
                                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                    {desc}
                                </div>
                            </div>
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
