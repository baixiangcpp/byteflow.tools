import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function ImageOptimizationForWebCompleteWorkflowPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="image-optimization-for-web-complete-workflow" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C5: Image Processing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Image optimization for web: complete workflow</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Reliable image optimization is not one action, it is a repeatable workflow. The best teams standardize dimensions,
                    control byte size, and verify quality budgets before publishing. This article outlines a practical process you can
                    run for marketing pages, product listings, and documentation assets.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Start with display constraints</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Optimization begins with layout constraints, not compression settings. Define the maximum rendered width for each image
                    role, then export only what those containers require. Oversized assets inflate transfer cost without improving visual
                    quality on real devices.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Hero images: capture the largest intended viewport width.</li>
                    <li>Cards and thumbnails: lock to fixed aspect ratios for consistency.</li>
                    <li>Icons and logos: use SVG where possible to avoid raster scaling issues.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Apply format and compression policy</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Use format rules per asset type. Photographic content usually benefits from modern lossy formats, while UI graphics
                    and vectors should remain lossless or vector-native. Keep compression settings in a narrow range and track visual
                    quality with before/after snapshots rather than subjective one-off checks.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Build a release checklist</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Production teams prevent regressions with explicit release gates: file-size limits, responsive variants, and fallback
                    rendering checks. Include one failing sample in QA so reviewers can confirm that out-of-policy files are blocked.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Hero image: 3840x2160, 5.4MB PNG
Card image: 1920x1080, 1.3MB JPG`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Hero: 1920x1080 optimized variant set
Card: 800x450 compressed target <180KB`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended image tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/image-resizer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_resizer.title}
                    </Link>
                    <Link href={`/${locale}/svg-optimizer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.svg_optimizer.title}
                    </Link>
                    <Link href={`/${locale}/svg-to-png-converter`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.svg_to_png_converter.title}
                    </Link>
                    <Link href={`/${locale}/image-filters`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_filters.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/color-extraction-from-images-use-cases-and-tools`}>
                        Color extraction from images: use cases and tools
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/svg-optimization-and-conversion-best-practices`}>
                        SVG optimization and conversion best practices
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
