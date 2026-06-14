import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function ModernCssEffectsGuidePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="modern-css-effects-guide" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C4: CSS & Design</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Modern CSS effects: glassmorphism, gradients, and more</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Visual effects can increase hierarchy and product personality, but overuse quickly hurts readability and performance.
                    The goal is not maximal decoration; it is meaningful emphasis with predictable rendering across devices.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Glassmorphism without visual debt</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Use backdrop blur and translucency to separate floating panels from busy backgrounds. Keep contrast explicit with subtle
                    borders and avoid stacking multiple blurred layers, which can reduce legibility and increase paint cost.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Gradient systems that scale</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Define gradient tokens for hero surfaces, accent strokes, and interactive states. Tokenization prevents random color drift
                    when multiple contributors update pages over time.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Keep a small set of approved gradient angles and stops.</li>
                    <li>Use lower saturation for large backgrounds and stronger accents for small focal points.</li>
                    <li>Pair gradient usage with solid fallback colors for constrained devices.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Effects and performance boundaries</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Shadows, filters, and animated gradients can dominate paint and compositing budgets. Profile effect-heavy screens with
                    throttled devices and define guardrails such as “no more than one animated gradient per viewport.”
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Hero panel on noisy image
Need: readable heading + CTA`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Panel: rgba(15,23,42,0.45)
Backdrop blur: 10px
Border: 1px rgba(255,255,255,0.18)`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended CSS tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/css-glassmorphism-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_glassmorphism_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-gradient-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_gradient_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-loader-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_loader_generator.title}
                    </Link>
                    <Link href={`/${locale}/color-mixer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.color_mixer.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/css-animations-and-transitions-guide`}>
                        Complete guide to CSS animations and transitions
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/css-border-radius-and-shapes-guide`}>
                        CSS border radius and shapes: visual guide
                    </Link>
                </p>
            </footer>
        </article>
    )
}
