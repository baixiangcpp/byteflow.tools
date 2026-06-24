import Link from "next/link"
import { requireTranslationValue, type Locale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import {
    GROWTH_PAGES,
    GROWTH_UI_COPY,
    getGrowthIndex,
    getGrowthPage,
    getGrowthPagesByKind,
    type GrowthIndexSlug,
    type GrowthPage,
    type GrowthPageCopy,
    type GrowthPageSlug,
} from "@/core/growth/growth-pages"
import { getToolByKey } from "@/core/registry"
import { ArticleJsonLd, CollectionPageJsonLd, HowToJsonLd } from "@/core/seo/components/page-json-ld"
import { JsonLdScript } from "@/core/seo/components/json-ld-script"
import { SITE_URL, buildCanonicalUrl } from "@/core/seo/urls"

function requireGrowthPage(slug: GrowthPageSlug) {
    const page = getGrowthPage(slug)
    if (!page) throw new Error(`[growth-pages] Missing growth page for ${slug}`)
    return page
}

function requireGrowthIndex(slug: GrowthIndexSlug) {
    const index = getGrowthIndex(slug)
    if (!index) throw new Error(`[growth-pages] Missing growth index for ${slug}`)
    return index
}

function indexSlugForPage(page: GrowthPage): GrowthIndexSlug {
    if (page.kind === "comparison") return "compare"
    if (page.kind === "alternative") return "alternatives"
    if (page.kind === "how-to") return "how-to"
    return "fix"
}

function getToolCards(locale: Locale, toolKeys: string[]) {
    const t = getTranslation(locale)
    const tools = t.tools as Record<string, { title?: string; description?: string }>

    return toolKeys.map((toolKey) => {
        const tool = getToolByKey(toolKey)
        if (!tool) throw new Error(`[growth-pages] Unknown related tool key: ${toolKey}`)

        return {
            key: toolKey,
            slug: tool.slug,
            title: requireTranslationValue(tools[toolKey]?.title, `tools.${toolKey}.title`),
            description: requireTranslationValue(tools[toolKey]?.description, `tools.${toolKey}.description`),
        }
    })
}

function breadcrumbJsonLd({ locale, items }: { locale: Locale; items: Array<{ name: string; slug?: string }> }) {
    const t = getTranslation(locale)

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: requireTranslationValue(t.nav.home, "nav.home"),
                item: buildCanonicalUrl(locale),
            },
            ...items.map((item, index) => ({
                "@type": "ListItem",
                position: index + 2,
                name: item.name,
                item: buildCanonicalUrl(locale, item.slug),
            })),
        ],
    }
}

function faqJsonLd(copy: GrowthPageCopy) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: copy.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    }
}

function PageStructuredData({
    locale,
    page,
    copy,
}: {
    locale: Locale
    page: GrowthPage
    copy: GrowthPageCopy
}) {
    const index = requireGrowthIndex(indexSlugForPage(page))
    const breadcrumb = breadcrumbJsonLd({
        locale,
        items: [
            { name: index.title[locale], slug: index.slug },
            { name: copy.title, slug: page.slug },
        ],
    })
    const howToSteps = copy.steps?.map((step, index) => ({
        name: step.name,
        text: step.text,
        url: `${buildCanonicalUrl(locale, page.slug)}#step-${index + 1}`,
    }))

    return (
        <>
            {page.kind === "how-to" || page.kind === "fix" ? (
                <HowToJsonLd
                    lang={locale}
                    slug={page.slug}
                    title={copy.title}
                    description={copy.description}
                    steps={howToSteps ?? []}
                />
            ) : (
                <ArticleJsonLd
                    lang={locale}
                    slug={page.slug}
                    title={copy.title}
                    description={copy.description}
                />
            )}
            <JsonLdScript data-jsonld="growth-breadcrumb" jsonLd={breadcrumb} />
            <JsonLdScript data-jsonld="growth-faq" jsonLd={faqJsonLd(copy)} />
        </>
    )
}

function Badge({ children }: { children: string }) {
    return (
        <span className="rounded-md border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {children}
        </span>
    )
}

export function GrowthContentPage({ locale, slug }: { locale: Locale; slug: GrowthPageSlug }) {
    const page = requireGrowthPage(slug)
    const copy = page.copy[locale]
    const ui = GROWTH_UI_COPY[locale]
    const relatedTools = getToolCards(locale, page.relatedToolKeys)
    const t = getTranslation(locale)
    const index = requireGrowthIndex(indexSlugForPage(page))

    return (
        <article className="mx-auto w-full max-w-6xl space-y-6">
            <PageStructuredData locale={locale} page={page} copy={copy} />

            <header className="rounded-lg border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge>{copy.eyebrow}</Badge>
                    <Badge>{index.title[locale]}</Badge>
                </div>
                <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    {copy.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {copy.description}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground">
                    {copy.intent}
                </p>
            </header>

            <section className="grid gap-3 md:grid-cols-3" aria-label={ui.keyTakeaways}>
                {copy.summaryPoints.map((point) => (
                    <div key={point} className="rounded-lg border border-border/70 bg-background/60 p-4 text-sm leading-relaxed text-muted-foreground">
                        {point}
                    </div>
                ))}
            </section>

            {copy.comparisonRows ? (
                <section className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold tracking-tight">{ui.decisionFactors}</h2>
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
                            <thead className="text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="border-b border-border/70 px-3 py-2">{ui.factor}</th>
                                    <th className="border-b border-border/70 px-3 py-2">{ui.byteflow}</th>
                                    <th className="border-b border-border/70 px-3 py-2">{ui.otherOption}</th>
                                    <th className="border-b border-border/70 px-3 py-2">{ui.practicalNote}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {copy.comparisonRows.map((row) => (
                                    <tr key={row.factor} className="align-top">
                                        <th className="border-b border-border/50 px-3 py-3 font-semibold text-foreground">{row.factor}</th>
                                        <td className="border-b border-border/50 px-3 py-3 text-muted-foreground">{row.byteflow}</td>
                                        <td className="border-b border-border/50 px-3 py-3 text-muted-foreground">{row.other}</td>
                                        <td className="border-b border-border/50 px-3 py-3 text-muted-foreground">{row.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            ) : null}

            {copy.steps ? (
                <section className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold tracking-tight">{ui.steps}</h2>
                    <ol className="mt-4 space-y-3">
                        {copy.steps.map((step, index) => {
                            const tool = step.toolKey ? relatedTools.find((item) => item.key === step.toolKey) : null
                            return (
                                <li key={step.name} id={`step-${index + 1}`} className="rounded-lg border border-border/60 bg-card/35 p-4">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">{index + 1}. {step.name}</p>
                                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
                                        </div>
                                        {tool ? (
                                            <Link
                                                href={`/${locale}/${tool.slug}`}
                                                className="inline-flex min-h-10 shrink-0 items-center rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                                {tool.title}
                                            </Link>
                                        ) : null}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                </section>
            ) : null}

            {copy.sections.map((section) => (
                <section key={section.heading} className="space-y-4 rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                    <h2 className="text-xl font-semibold tracking-tight">{section.heading}</h2>
                    {section.body.map((paragraph) => (
                        <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                            {paragraph}
                        </p>
                    ))}
                    {section.bullets ? (
                        <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                            {section.bullets.map((bullet) => (
                                <li key={bullet}>{bullet}</li>
                            ))}
                        </ul>
                    ) : null}
                </section>
            ))}

            <section className="rounded-lg border border-border/70 bg-card/55 p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">{ui.toolsInWorkflow}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                            {ui.toolsInWorkflowDescription}
                        </p>
                    </div>
                    <Link
                        href={`/${locale}/trust-center`}
                        className="inline-flex min-h-10 items-center rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {t.pages.trust_center_title}
                    </Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {relatedTools.map((tool) => (
                        <Link
                            key={tool.key}
                            href={`/${locale}/${tool.slug}`}
                            className="rounded-lg border border-border/70 bg-background/70 p-4 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <p className="font-medium">{tool.title}</p>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{ui.trustCheck}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.trustCenterAngle}</p>
                <Link
                    href={`/${locale}/trust-center`}
                    className="mt-4 inline-flex min-h-10 items-center rounded-md border border-border/75 bg-card/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {t.pages.trust_center_title}
                </Link>
            </section>

            <section className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{ui.faq}</h2>
                <div className="mt-4 grid gap-3">
                    {copy.faq.map((item) => (
                        <div key={item.question} className="rounded-lg border border-border/60 bg-card/35 p-4">
                            <h3 className="text-sm font-semibold">{item.question}</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.answer}</p>
                        </div>
                    ))}
                </div>
            </section>
        </article>
    )
}

export function GrowthIndexPage({ locale, slug }: { locale: Locale; slug: GrowthIndexSlug }) {
    const index = requireGrowthIndex(slug)
    const ui = GROWTH_UI_COPY[locale]
    const pages = getGrowthPagesByKind(index.kind)
    const breadcrumb = breadcrumbJsonLd({
        locale,
        items: [{ name: index.title[locale], slug: index.slug }],
    })

    return (
        <div className="mx-auto w-full max-w-6xl space-y-6">
            <CollectionPageJsonLd
                lang={locale}
                slug={slug}
                title={index.title[locale]}
                description={index.description[locale]}
                items={pages.map((page) => ({
                    name: page.copy[locale].title,
                    description: page.copy[locale].description,
                    url: buildCanonicalUrl(locale, page.slug),
                }))}
            />
            <JsonLdScript data-jsonld="growth-index-breadcrumb" jsonLd={breadcrumb} />

            <header className="rounded-lg border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{index.eyebrow[locale]}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{index.title[locale]}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {index.description[locale]}
                </p>
            </header>

            <section className="grid gap-4 md:grid-cols-2" aria-label={index.title[locale]}>
                {pages.map((page) => {
                    const copy = page.copy[locale]
                    return (
                        <Link
                            key={page.slug}
                            href={`/${locale}/${page.slug}`}
                            className="rounded-lg border border-border/70 bg-background/65 p-5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge>{copy.eyebrow}</Badge>
                                <Badge>{ui.toolCount(page.relatedToolKeys.length)}</Badge>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold tracking-tight">{copy.title}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
                        </Link>
                    )
                })}
            </section>

            <section className="rounded-lg border border-border/70 bg-card/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{ui.trustBaselineTitle}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {ui.trustBaselineDescription}
                </p>
                <Link
                    href={`/${locale}/trust-center`}
                    className="mt-4 inline-flex min-h-10 items-center rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {getTranslation(locale).pages.trust_center_title}
                </Link>
            </section>
        </div>
    )
}

export function getAllGrowthPageSlugs() {
    return GROWTH_PAGES.map((page) => page.slug)
}

export function buildGrowthFaqJsonLd(locale: Locale, page: GrowthPage) {
    return faqJsonLd(page.copy[locale])
}

export function buildGrowthBreadcrumbJsonLd(locale: Locale, page: GrowthPage) {
    const index = requireGrowthIndex(indexSlugForPage(page))
    return breadcrumbJsonLd({
        locale,
        items: [
            { name: index.title[locale], slug: index.slug },
            { name: page.copy[locale].title, slug: page.slug },
        ],
    })
}

export function buildGrowthArticleWebPageJsonLd(locale: Locale, page: GrowthPage) {
    const copy = page.copy[locale]

    return {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${buildCanonicalUrl(locale, page.slug)}#webpage`,
        name: copy.title,
        description: copy.description,
        url: buildCanonicalUrl(locale, page.slug),
        inLanguage: locale,
        isPartOf: { "@id": `${SITE_URL}/#website` },
    }
}
