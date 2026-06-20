import type { Metadata } from "next"
import Link from "next/link"
import {
    Braces,
    Calculator,
    KeyRound,
    Languages,
    Network,
    Palette,
    Regex,
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
] as const

export const metadata: Metadata = {
    title: {
        absolute: "byteflow.tools | Privacy-first Local Developer Tools",
    },
    description: "Privacy-first local developer tools that run in your browser. No account, installable PWA, open source, and built for sensitive JSON, JWT, Base64, hashing, URL, and workflow tasks.",
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
                                Privacy-first local developer tools
                            </div>
                            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                                byteflow.tools
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                Format, encode, decode, inspect, and generate developer data in your browser. Most tools run entirely locally, require no account, install as a PWA, and are open source for verification.
                            </p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link
                                    href="/en"
                                    className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                >
                                    Open English home
                                </Link>
                                <Link
                                    href="/en/all-tools"
                                    className="inline-flex min-h-11 items-center rounded-lg border border-border/75 bg-background/75 px-5 text-sm font-medium text-foreground transition-colors hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45"
                                >
                                    Browse all tools
                                </Link>
                            </div>
                        </div>

                        <section className="border-l border-border/70 pl-0 lg:pl-6" aria-labelledby="root-language-title">
                            <div className="flex items-center gap-2">
                                <Languages className="h-4 w-4 text-primary" />
                                <h2 id="root-language-title" className="text-sm font-semibold">
                                    Choose your language
                                </h2>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                The root page is the x-default entry. Automatic locale detection is available, and every localized home remains directly accessible.
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

                <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-labelledby="root-popular-tools">
                    <div className="sm:col-span-2 lg:col-span-3">
                        <h2 id="root-popular-tools" className="text-xl font-semibold tracking-tight">
                            Popular tools
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Start with common local workflows for JSON, JWT, Base64, hashing, URLs, and IDs.
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
                            {formatToolRegistryStatsTemplate("{categoryCount} curated categories", stats)}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Browse tools by task family, runtime privacy, and developer workflow.
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
                        Privacy-first by default
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                        Browser-local tools process input and output on your device. Tools marked External request only contact the network when you explicitly run them, and the project keeps source code, privacy policy, and installable PWA behavior visible for review.
                    </p>
                </section>
        </main>
    )
}
