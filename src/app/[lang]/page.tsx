import type { Metadata } from "next"
import Link from "next/link"
import {
  ShieldCheck,
  Zap,
  Compass,
  Puzzle,
  Braces,
  KeyRound,
  Palette,
  Network,
  TerminalSquare,
  Regex,
  Calculator,
  Share2,
} from "lucide-react"
import { notFound } from "next/navigation"
import { isValidLocale, requireTranslationValue } from "@/core/i18n/i18n"
import { SearchButton } from "./search-button"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { MENU_GROUP_DEFS, getMenuGroups } from "@/core/registry/menu-groups"
import { formatToolRegistryStatsTemplate, getToolRegistryStats } from "@/core/registry/stats"
import { PopularToolsSection } from "@/features/home/components/popular-tools-section"
import { HomeCategoryPreview } from "@/features/home/components/home-category-preview"
import { ALL_TOOLS_SECTION_ID } from "@/core/routing/all-tools-route"
import { buildHomepageCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls"

type FeatureCard = {
  key: "privacy" | "speed" | "keyboard" | "tools"
  icon: typeof ShieldCheck
  title: string
  description: string
  iconClass: string
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params
  if (!isValidLocale(lang)) {
    notFound()
  }

  return {
    title: {
      absolute: getTranslation(lang).site.title,
    },
    alternates: {
      canonical: buildHomepageCanonicalUrl(lang),
      languages: buildLocalizedAlternates(),
    },
    robots: lang === "en" ? { index: false, follow: true } : undefined,
  }
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isValidLocale(lang)) {
    notFound()
  }

  const locale = lang
  const t = getTranslation(locale)
  const registryStats = getToolRegistryStats()
  const heroSearchLabel = t.site.hero_search
  const commonLabels = t.common
  const installAppLinkLabel = requireTranslationValue(commonLabels.install_as_app, "common.install_as_app")

  const categoryLinks = MENU_GROUP_DEFS

  const featureCards: FeatureCard[] = [
    {
      key: "privacy",
      icon: ShieldCheck,
      title: t.features.privacy_title,
      description: t.features.privacy_desc,
      iconClass: "border-cyan-500/30 bg-cyan-500/12 text-cyan-400",
    },
    {
      key: "speed",
      icon: Zap,
      title: t.features.speed_title,
      description: t.features.speed_desc,
      iconClass: "border-emerald-500/30 bg-emerald-500/12 text-emerald-400",
    },
    {
      key: "keyboard",
      icon: Compass,
      title: t.features.keyboard_title,
      description: formatToolRegistryStatsTemplate(t.features.keyboard_desc, registryStats),
      iconClass: "border-amber-500/30 bg-amber-500/12 text-amber-400",
    },
    {
      key: "tools",
      icon: Puzzle,
      title: t.features.tools_title,
      description: t.features.tools_desc,
      iconClass: "border-blue-500/30 bg-blue-500/12 text-blue-400",
    },
  ]

  const categoryDescriptions = t.categories as Record<string, string>
  const localizedTools = t.tools as Record<string, { title?: string; description?: string }>
  const menuGroups = getMenuGroups()
  const categoryToolCounts = Object.fromEntries(
    registryStats.categories.map((category) => [category.key, category.toolCount])
  ) as Record<string, number>
  const categoryIcons = {
    data_code_formats: Braces,
    encoding_crypto: KeyRound,
    web_api_network: Network,
    devops_logs: TerminalSquare,
    text_regex: Regex,
    images_svg_css: Palette,
    generators_calculators: Calculator,
    social_metadata: Share2,
  } as const
  const categoryIconClass = {
    data_code_formats: "border-cyan-500/30 bg-cyan-500/12 text-cyan-400",
    encoding_crypto: "border-blue-500/30 bg-blue-500/12 text-blue-400",
    web_api_network: "border-indigo-500/30 bg-indigo-500/12 text-indigo-400",
    devops_logs: "border-emerald-500/30 bg-emerald-500/12 text-emerald-400",
    text_regex: "border-violet-500/30 bg-violet-500/12 text-violet-400",
    images_svg_css: "border-pink-500/30 bg-pink-500/12 text-pink-400",
    generators_calculators: "border-amber-500/30 bg-amber-500/12 text-amber-400",
    social_metadata: "border-rose-500/30 bg-rose-500/12 text-rose-400",
  } as const
  const heroCategoryLinks = categoryLinks.map((item) => ({
    ...item,
    toolCount: categoryToolCounts[item.key] ?? 0,
  }))
  const categoryNavLabels = Object.fromEntries(
    categoryLinks.map((item) => [item.key, requireTranslationValue(t.nav[item.key], `nav.${item.key}`)])
  ) as Record<(typeof MENU_GROUP_DEFS)[number]["key"], string>
  const getLocalizedToolTitle = (toolKey: string) =>
    requireTranslationValue(localizedTools[toolKey]?.title, `tools.${toolKey}.title`)
  const getLocalizedToolDescription = (toolKey: string) =>
    requireTranslationValue(localizedTools[toolKey]?.description, `tools.${toolKey}.description`)
  const featureCardSurfaceClass = {
    privacy: "bg-[linear-gradient(160deg,hsl(189_94%_46%/0.12),transparent_55%)]",
    speed: "bg-[linear-gradient(160deg,hsl(148_75%_45%/0.12),transparent_55%)]",
    keyboard: "bg-[linear-gradient(160deg,hsl(39_94%_56%/0.13),transparent_55%)]",
    tools: "bg-[linear-gradient(160deg,hsl(218_91%_60%/0.12),transparent_55%)]",
  } as const

  const toolCatalogGroups = categoryLinks.map((category) => {
    const menuGroup = menuGroups.find((group) => group.key === category.key)
    const groupDescription = categoryDescriptions[`${category.key}_desc`] || t.features.tools_desc
    return {
      key: category.key,
      title: categoryNavLabels[category.key],
      description: groupDescription,
      href: `/${locale}/${category.slug}`,
      toolCount: categoryToolCounts[category.key] ?? 0,
      tools: (menuGroup?.items ?? []).map((tool) => ({
        key: tool.key,
        slug: `/${locale}/${tool.slug}`,
        title: getLocalizedToolTitle(tool.key),
        description: getLocalizedToolDescription(tool.key),
      })),
    }
  })

  return (
    <div className="relative flex flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[8%] top-[-24%] h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-2xl sm:h-[460px] sm:w-[460px] sm:blur-3xl lg:h-[540px] lg:w-[540px]" />
        <div className="absolute right-0 top-[-26%] h-[320px] w-[320px] rounded-full bg-amber-500/16 blur-2xl sm:right-[-8%] sm:h-[460px] sm:w-[460px] sm:blur-3xl lg:h-[540px] lg:w-[540px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/90" />
      </div>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-12 px-4 pb-20 pt-10 sm:px-6 lg:gap-16 lg:px-8">
        {/* Hero Section */}
        <section
          className="home-reveal relative overflow-hidden rounded-[2rem] border border-border/75 bg-card/70 px-6 py-12 shadow-[0_32px_80px_-36px_rgba(0,0,0,0.75)] backdrop-blur-md dark:shadow-black/60 md:backdrop-blur-xl sm:px-8 sm:py-14 lg:px-12 lg:py-16"
          style={{ animationDelay: "40ms" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,hsl(189_94%_46%/0.14),transparent_40%,hsl(31_94%_56%/0.14))]" />
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(hsl(215_30%_84%/0.26)_1px,transparent_1px),linear-gradient(90deg,hsl(215_30%_84%/0.26)_1px,transparent_1px)] [background-size:34px_34px]" />

          <div className="relative max-w-4xl mx-auto text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/12 px-4 py-2 text-sm font-medium text-primary shadow-sm shadow-primary/20">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_6px_rgba(14,165,233,0.22)] animate-pulse" />
              {t.site.hero_badge}
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-300 bg-clip-text text-transparent">
                {formatToolRegistryStatsTemplate(t.site.hero_title_highlight, registryStats)}
              </span>
              <br />
              {t.site.hero_title_2}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
              {t.site.hero_subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <SearchButton label={heroSearchLabel} />
              <Link
                href={`/${locale}/pipeline-builder`}
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-lg border border-primary/35 bg-primary/12 px-5 text-sm font-medium text-primary backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-primary/16 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {getLocalizedToolTitle("pipeline_builder")}
              </Link>
              <Link
                href={`/${locale}/install-app`}
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-lg border border-border/60 bg-background/80 px-5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-background hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {installAppLinkLabel}
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Navigation Cards - Compact Grid */}
        <section
          className="home-reveal grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          style={{ animationDelay: "80ms" }}
        >
          {heroCategoryLinks.map((item) => {
            const Icon = categoryIcons[item.key]

            return (
              <Link
                key={item.key}
                href={`/${locale}/${item.slug}`}
                prefetch={false}
                className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80 hover:shadow-xl hover:shadow-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 dark:hover:shadow-black/25"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${categoryIconClass[item.key]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{categoryNavLabels[item.key]}</div>
                  </div>
                  <span className="inline-flex min-h-6 items-center rounded-full border border-border/80 bg-background/75 px-2 text-xs font-medium text-muted-foreground">
                    {item.toolCount}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {categoryDescriptions[`${item.key}_desc`] || ''}
                </p>
              </Link>
            )
          })}
        </section>

        <PopularToolsSection locale={locale} />

        {/* Explore by Category - Preview */}
        <section id={ALL_TOOLS_SECTION_ID}>
          <HomeCategoryPreview
            locale={locale}
            groups={toolCatalogGroups}
            openLabel={t.common.open}
            toolsLabel={t.common.tools}
          />
        </section>

        {/* Feature Highlights - 2x2 Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:gap-5">
          {featureCards.map((card, index) => {
            const Icon = card.icon
            const cardTone = featureCardSurfaceClass[card.key as keyof typeof featureCardSurfaceClass]
            return (
              <article
                key={card.key}
                className="home-reveal group relative overflow-hidden rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-black/15 dark:hover:shadow-black/40"
                style={{ animationDelay: `${140 + index * 45}ms` }}
              >
                <div className={`pointer-events-none absolute inset-0 opacity-70 ${cardTone}`} />
                <div className="relative flex items-start gap-4">
                  <span className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${card.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground mb-2">{card.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </section>

      </div>
    </div>
  )
}
