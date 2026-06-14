import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function CssBorderRadiusAndShapesGuidePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="css-border-radius-and-shapes-guide" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C4: CSS & Design</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">CSS border radius and shapes: visual guide</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Shape language has strong UX impact: it can communicate hierarchy, clickability, and brand tone. Using radius and shape
                    systems consistently makes interfaces feel intentional instead of assembled from unrelated components.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Radius tokens over ad-hoc values</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Define a small radius scale (for example 4 / 8 / 12 / 16) and map it to component roles. This avoids visual drift when
                    different teams style cards, inputs, badges, and dialogs independently.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Triangles, notches, and directional cues</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Shape primitives such as triangles and clipped corners are useful for pointers, callouts, and onboarding cues. Keep these
                    accents small and consistent, and tie them to semantic states instead of decorative noise.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Clip-path in production</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Clip-path enables expressive cards and media masks, but compatibility and maintainability matter. Reserve complex shapes for
                    controlled surfaces and keep fallback rectangles for lower-capability environments.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Component: promo card
Need: soft corners + top-right notch`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`border-radius: 16px
clip-path: polygon(...)
fallback: border-radius only`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended CSS tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/css-border-radius-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_border_radius_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-triangle-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_triangle_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-clip-path-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_clip_path_generator.title}
                    </Link>
                    <Link href={`/${locale}/css-background-pattern-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.css_background_pattern_generator.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/css-layout-patterns-for-developers`}>
                        CSS layout patterns every developer should know
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/modern-css-effects-guide`}>
                        Modern CSS effects: glassmorphism, gradients, and more
                    </Link>
                </p>
            </footer>
        </article>
    )
}
