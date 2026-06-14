import Link from "next/link"
import {
    getLocalizedArticle,
    getLocalizedArticleTitle,
    type LocalizedArticleSection,
    type LocalizedArticleSlug,
    type NonEnglishLocale,
} from "@/core/seo/localized-articles"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

function renderSection(section: LocalizedArticleSection) {
    return (
        <section key={section.title} className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                    {paragraph}
                </p>
            ))}
            {section.bullets ? (
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            ) : null}
            {section.ordered ? (
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    {section.ordered.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ol>
            ) : null}
        </section>
    )
}

export function LocalizedArticlePage({
    locale,
    slug,
}: {
    locale: NonEnglishLocale
    slug: LocalizedArticleSlug
}) {
    const t = getTranslation(locale)
    const tools = t.tools as Record<string, { title: string }>
    const article = getLocalizedArticle(slug, locale)
    const nextTitle = article.next ? getLocalizedArticleTitle(article.next, locale) : null
    const siblingTitle = article.sibling ? getLocalizedArticleTitle(article.sibling, locale) : null

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{article.clusterLabel}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{article.copy.title}</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{article.copy.description}</p>
            </header>

            {article.copy.sections.map(renderSection)}

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">{article.ui.exampleTitle}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{article.ui.inputLabel}</p>
                        <pre className="overflow-x-auto text-xs whitespace-pre-wrap">{article.copy.exampleInput}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{article.ui.outputLabel}</p>
                        <pre className="overflow-x-auto text-xs whitespace-pre-wrap">{article.copy.exampleOutput}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">{article.toolsTitle}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    {article.relatedTools.map((tool) => {
                        const label = tool.labelByLocale?.[locale] ??
                            (tool.toolKey
                                ? requireTranslationValue(tools[tool.toolKey]?.title, `tools.${tool.toolKey}.title`)
                                : requireTranslationValue(undefined, `localizedArticles.${slug}.relatedTools.${tool.slug}.label`))

                        return (
                            <Link
                                key={tool.slug}
                                href={`/${locale}/${tool.slug}`}
                                className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35"
                            >
                                {label}
                            </Link>
                        )
                    })}
                </div>
            </section>

            {(article.next && nextTitle) || (article.sibling && siblingTitle) ? (
                <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                    {article.next && nextTitle ? (
                        <p>
                            {article.ui.nextLabel}{" "}
                            <Link className="text-foreground hover:text-primary" href={`/${locale}/${article.next}`}>
                                {nextTitle}
                            </Link>
                        </p>
                    ) : null}
                    {article.sibling && siblingTitle ? (
                        <p className={article.next && nextTitle ? "mt-2" : undefined}>
                            {article.ui.siblingLabel}{" "}
                            <Link className="text-foreground hover:text-primary" href={`/${locale}/${article.sibling}`}>
                                {siblingTitle}
                            </Link>
                        </p>
                    ) : null}
                </footer>
            ) : null}
        </article>
    )
}
