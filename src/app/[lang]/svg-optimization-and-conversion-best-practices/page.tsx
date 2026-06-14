import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function SvgOptimizationAndConversionBestPracticesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="svg-optimization-and-conversion-best-practices" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C5: Image Processing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">SVG optimization and conversion best practices</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    SVG is one of the most efficient formats for UI graphics, but ungoverned exports can still include unnecessary metadata,
                    verbose paths, and inconsistent viewBox settings. A disciplined optimization pipeline protects both render quality and
                    performance.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Optimize with safe transformations</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Not every optimization pass is safe for production. Prioritize deterministic removals such as editor metadata, unused
                    definitions, and redundant precision. Validate icon alignment and stroke rendering after each preset change.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Normalize geometry and naming</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Keep viewBox values and coordinate systems consistent across an icon set. When designers and developers share geometry
                    rules, conversion bugs and clipping surprises are easier to detect during review.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Use consistent artboard size for related assets.</li>
                    <li>Preserve path semantics for maintainability.</li>
                    <li>Version generated assets with deterministic naming.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Convert only at delivery boundaries</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Keep SVG as source-of-truth and generate PNG or raster outputs for environments that require fixed bitmaps. Avoid editing
                    converted outputs as primary assets, otherwise iterative quality loss and inconsistency accumulate quickly.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`120KB exported SVG with editor metadata
Need web icon + social preview PNG`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Optimized SVG under 20KB
Derived PNG in required target sizes`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended image tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/svg-optimizer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.svg_optimizer.title}
                    </Link>
                    <Link href={`/${locale}/svg-blob-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.svg_blob_generator.title}
                    </Link>
                    <Link href={`/${locale}/svg-pattern-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.svg_pattern_generator.title}
                    </Link>
                    <Link href={`/${locale}/svg-to-png-converter`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.svg_to_png_converter.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/image-privacy-how-to-censor-and-protect-images`}>
                        Image privacy: how to censor and protect images
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/image-optimization-for-web-complete-workflow`}>
                        Image optimization for web: complete workflow
                    </Link>
                </p>
            </footer>
        </article>
    )
}
