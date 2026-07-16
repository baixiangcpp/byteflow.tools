import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function CssAnimationsAndTransitionsGuidePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="css-animations-and-transitions-guide" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C4: CSS & Design</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Complete guide to CSS animations and transitions</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Motion should clarify interaction state, not distract from content. The best animation systems are small, consistent,
                    and tuned for perceived responsiveness. This guide covers decision rules for transitions, keyframes, and easing curves.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Transitions for state changes</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Use transitions for predictable A-to-B state updates: hover, focus, expansion, and panel toggles. Limit properties to
                    opacity and transform where possible to avoid layout-heavy animation paths.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Keyframes for narrative motion</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Keyframes are better for sequences, loaders, and directional emphasis. Keep looped keyframes subtle and provide reduced-
                    motion fallbacks so animation does not become a usability barrier.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Easing strategy and consistency</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Define a small easing scale: entrance, exit, and emphasis. Reusing easing tokens improves consistency and helps teams
                    avoid ad-hoc cubic-bezier values that feel inconsistent across components.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Component: toggle switch
Need: snappy state feedback`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`transition: transform 180ms cubic-bezier(.2,.8,.2,1)
color transition: 140ms ease-out`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended CSS tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/css-cubic-bezier-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_cubic_bezier_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-loader-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_loader_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-switch-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_switch_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-text-glitch-effect-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_text_glitch_effect_generator.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/css-border-radius-and-shapes-guide`}>
                        CSS border radius and shapes: visual guide
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/css-layout-patterns-for-developers`}>
                        CSS layout patterns every developer should know
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
