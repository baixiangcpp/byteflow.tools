import type { Metadata } from "next"
import Link from "next/link"
import {
    BadgeCheck,
    Braces,
    Calculator,
    Download,
    KeyRound,
    Languages,
    LockKeyhole,
    Network,
    Palette,
    Regex,
    Search,
    Share2,
    ShieldCheck,
    TerminalSquare,
} from "lucide-react"
import { LOCALES, LOCALE_NAMES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { formatToolRegistryStatsTemplate, getToolRegistryStats } from "@/core/registry/stats"
import { TOOL_REGISTRY } from "@/core/registry"
import { SITE_URL, buildLocalizedAlternates } from "@/core/seo/urls"
import { SiteJsonLd } from "@/core/seo/components/site-json-ld"

const CATEGORY_ICONS = {
    data_code_formats: Braces,
    encoding_crypto: KeyRound,
    web_api_network: Network,
    devops_logs: TerminalSquare,
    text_regex: Regex,
    images_svg_css: Palette,
    generators_calculators: Calculator,
    social_metadata: Share2,
} as const

const POPULAR_TOOL_KEYS = [
    "json_formatter",
    "jwt_decoder",
    "base64_encode_decode",
    "hash_generator",
    "url_encode_decode",
    "uuid_generator",
    "regex_tester",
    "markdown_preview",
] as const

export const metadata: Metadata = {
    title: {
        absolute: "byteflow.tools | Privacy-first Local Developer Tools",
    },
    description: "Format, convert, generate, and inspect data with 100+ local browser tools for developers. No signup, no server-side processing, open source, and installable as a PWA.",
    alternates: {
        canonical: SITE_URL,
        languages: buildLocalizedAlternates(),
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootPage() {
    const t = getTranslation("en")
    const stats = getToolRegistryStats()
    const rootHeadline = formatToolRegistryStatsTemplate(t.site.root_title, stats)
    const categoryToolCounts = Object.fromEntries(
        stats.categories.map((category) => [category.key, category.toolCount])
    ) as Record<string, number>
    const toolsByKey = new Map(TOOL_REGISTRY.map((tool) => [tool.key, tool]))
    const localizedTools = t.tools as Record<string, { title?: string; description?: string }>
    const categoryDescriptions = t.categories as Record<string, string>
    const navLabels = t.nav as Record<string, string>

    return (
        <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <SiteJsonLd lang="en" />
            <section className="border-b border-border/70 py-10 sm:py-12">
                <div className="grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {t.site.root_badge}
                        </div>
                        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                            {rootHeadline}
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                            {t.site.root_subtitle}
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link
                                href="/en/all-tools#tool-discovery"
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                <Search className="h-4 w-4" />
                                {t.site.root_cta_search}
                            </Link>
                            <Link
                                href="/en/all-tools"
                                className="inline-flex min-h-11 items-center rounded-lg border border-border/75 bg-background/75 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                {t.site.root_cta_browse}
                            </Link>
                            <Link
                                href="/en/install-app"
                                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border/75 bg-background/75 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                            >
                                <Download className="h-4 w-4" />
                                {t.site.root_cta_install}
                            </Link>
                        </div>
                        <dl className="mt-7 grid gap-3 text-sm sm:grid-cols-3">
                            <div className="rounded-lg border border-border/70 bg-card/55 p-3">
                                <dt className="flex items-center gap-2 font-medium text-foreground">
                                    <BadgeCheck className="h-4 w-4 text-primary" />
                                    {t.site.root_free_title}
                                </dt>
                                <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {t.site.root_free_desc}
                                </dd>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-card/55 p-3">
                                <dt className="flex items-center gap-2 font-medium text-foreground">
                                    <LockKeyhole className="h-4 w-4 text-primary" />
                                    {t.site.root_local_title}
                                </dt>
                                <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {t.site.root_local_desc}
                                </dd>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-card/55 p-3">
                                <dt className="flex items-center gap-2 font-medium text-foreground">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    {t.site.root_verifiable_title}
                                </dt>
                                <dd className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {t.site.root_verifiable_desc}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <section className="border-l border-border/70 pl-0 lg:pl-6" aria-labelledby="root-language-title">
                        <div className="flex items-center gap-2">
                            <Languages className="h-4 w-4 text-primary" />
                            <h2 id="root-language-title" className="text-sm font-semibold">
                                {t.site.root_language_title}
                            </h2>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {t.site.root_language_desc}
                        </p>
                        <ul className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 lg:grid-cols-2">
                            {LOCALES.map((locale) => (
                                <li key={locale}>
                                    <Link
                                        href={`/${locale}`}
                                        className="flex min-h-11 items-center justify-between rounded-lg border border-border/70 bg-card/55 px-3 text-sm transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                    >
                                        <span>{LOCALE_NAMES[locale]}</span>
                                        <span className="text-xs text-muted-foreground">{locale}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-labelledby="root-popular-tools">
                <div className="sm:col-span-2 lg:col-span-4">
                    <h2 id="root-popular-tools" className="text-xl font-semibold tracking-tight">
                        {t.site.root_popular_title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t.site.root_popular_subtitle}
                    </p>
                </div>
                {POPULAR_TOOL_KEYS.map((toolKey) => {
                    const tool = toolsByKey.get(toolKey)
                    if (!tool) return null
                    const copy = localizedTools[toolKey] ?? { title: tool.slug, description: "" }
                    return (
                        <Link
                            key={toolKey}
                            href={`/en/${tool.slug}`}
                            className="rounded-lg border border-border/70 bg-card/55 p-4 transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                        >
                            <h3 className="text-sm font-semibold">{copy.title}</h3>
                            <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {copy.description}
                            </p>
                        </Link>
                    )
                })}
            </section>

            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-labelledby="root-categories">
                <div className="sm:col-span-2 lg:col-span-4">
                    <h2 id="root-categories" className="text-xl font-semibold tracking-tight">
                        {formatToolRegistryStatsTemplate(t.site.root_categories_title, stats)}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {t.site.root_categories_subtitle}
                    </p>
                </div>
                {MENU_GROUP_DEFS.map((item) => {
                    const Icon = CATEGORY_ICONS[item.key]
                    return (
                        <Link
                            key={item.key}
                            href={`/en/${item.slug}`}
                            className="rounded-lg border border-border/70 bg-card/55 p-4 transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                        >
                            <div className="flex items-center gap-3">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-semibold">
                                        {navLabels[item.navKey]}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {categoryToolCounts[item.key] ?? 0} tools
                                    </p>
                                </div>
                            </div>
                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                                {categoryDescriptions[`${item.key}_desc`] ?? "Focused developer tools for this workflow."}
                            </p>
                        </Link>
                    )
                })}
            </section>

            <section className="rounded-lg border border-border/70 bg-card/55 p-5" aria-labelledby="root-privacy">
                <h2 id="root-privacy" className="text-lg font-semibold tracking-tight">
                    {t.site.root_privacy_title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                    {t.site.root_privacy_desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        href="/en/privacy"
                        className="inline-flex min-h-10 items-center rounded-lg border border-border/75 bg-background/70 px-4 text-sm font-medium transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                    >
                        {t.site.root_privacy_policy}
                    </Link>
                    <Link
                        href="/en/trust-center"
                        className="inline-flex min-h-10 items-center rounded-lg border border-border/75 bg-background/70 px-4 text-sm font-medium transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                    >
                        {t.site.root_trust_center}
                    </Link>
                    <Link
                        href="/en/pricing"
                        className="inline-flex min-h-10 items-center rounded-lg border border-border/75 bg-background/70 px-4 text-sm font-medium transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                    >
                        {t.site.root_free_open_source}
                    </Link>
                </div>
            </section>
        </main>
    )
}
