import Link from "next/link"
import { getTranslation } from "@/core/i18n/translations/catalog"
import type { Locale } from "@/core/i18n/i18n"
import { getToolByKey } from "@/core/registry"
import { Star } from "lucide-react"

// 9 core high-traffic tools
const POPULAR_TOOL_KEYS = [
  "json_formatter",
  "base64_encode_decode",
  "jwt_decoder",
  "hash_generator",
  "url_encode_decode",
  "uuid_generator",
  "crontab_generator",
  "regex_tester",
  "json_to_typescript",
] as const

interface PopularToolsSectionProps {
  locale: Locale
}

export function PopularToolsSection({ locale }: PopularToolsSectionProps) {
  const t = getTranslation(locale)
  const tools = t.tools as Record<string, { title?: string; description?: string; slug?: string }>

  // Pre-resolve all popular tools with defensive checks
  const popularTools = POPULAR_TOOL_KEYS.flatMap((key) => {
    const tool = tools[key]
    const manifest = getToolByKey(key)

    if (!tool || !manifest) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[PopularToolsSection] Missing tool metadata for key: ${key}`)
      }
      return []
    }

    return [{ key, tool, slug: manifest.slug }]
  })

  if (
    process.env.NODE_ENV === "development" &&
    popularTools.length !== POPULAR_TOOL_KEYS.length
  ) {
    console.warn(
      `[PopularToolsSection] Expected ${POPULAR_TOOL_KEYS.length} popular tools, got ${popularTools.length}.`
    )
  }

  if (popularTools.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[PopularToolsSection] No popular tools resolved.")
    }
    return null
  }

  return (
    <section
      className="home-reveal relative overflow-hidden rounded-3xl border border-border/75 bg-card/60 p-4 shadow-xl shadow-black/10 backdrop-blur-sm dark:shadow-black/35 sm:p-6"
      style={{ animationDelay: "120ms" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(189_94%_46%/0.08),transparent_42%)]" />
      <div className="relative">
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" fill="currentColor" />
          <h2 className="text-xl font-semibold tracking-tight">
            {t.site.popular_tools_title}
          </h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          {t.site.popular_tools_subtitle}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {popularTools.map(({ key, tool, slug }) => (
            <Link
              key={key}
              href={`/${locale}/${slug}`}
              prefetch={false}
              className="group relative overflow-hidden rounded-xl border border-border/75 bg-card/50 px-4 py-3 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:hover:shadow-black/25"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <span className="text-xs font-semibold">
                    {tool.title?.charAt(0) || key.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 font-medium text-foreground">
                    {tool.title}
                  </h3>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
