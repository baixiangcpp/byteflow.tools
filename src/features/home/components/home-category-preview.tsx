import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Locale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

const PREVIEW_TOOL_LIMIT = 4

type ToolPreview = {
  key: string
  slug: string
  title: string
  description: string
}

type CategoryGroup = {
  key: string
  title: string
  description: string
  href: string
  toolCount: number
  tools: ToolPreview[]
}

interface HomeCategoryPreviewProps {
  locale: Locale
  groups: CategoryGroup[]
  openLabel: string
  toolsLabel: string
}

export function HomeCategoryPreview({
  locale,
  groups,
  openLabel,
  toolsLabel,
}: HomeCategoryPreviewProps) {
  const t = getTranslation(locale)

  return (
    <div className="space-y-4">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {t.site.explore_by_category_title}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {t.site.explore_by_category_subtitle}
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((group, index) => (
          <article
            key={group.key}
            className="home-reveal group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/25"
            style={{ animationDelay: `${200 + index * 40}ms` }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {group.title}
                </h3>
                <span className="inline-flex min-h-6 items-center rounded-full border border-border/80 bg-background/75 px-2 text-xs font-medium text-muted-foreground">
                  {group.toolCount}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {group.description}
              </p>
            </div>

            <ul className="mb-4 space-y-2">
              {group.tools.slice(0, PREVIEW_TOOL_LIMIT).map((tool) => (
                <li key={tool.key}>
                  <Link
                    href={tool.slug}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted/60"
                  >
                    {tool.title}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href={group.href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {openLabel} {group.toolCount} {toolsLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
