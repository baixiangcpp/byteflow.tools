import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function ColorExtractionFromImagesUseCasesAndToolsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="color-extraction-from-images-use-cases-and-tools" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C5: Image Processing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Color extraction from images: use cases and tools</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Extracting color palettes from real visuals helps teams maintain brand consistency and accelerate design iteration.
                    Instead of manually sampling values in each design file, teams can define repeatable palette workflows tied to real
                    source images and campaign assets.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Build palette intent before extraction</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Define whether you need dominant brand colors, accent candidates, or neutral support tones. Without intent, extracted
                    palettes often include noisy midtones that are difficult to apply in UI systems.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Dominant colors for hero backgrounds and category headers.</li>
                    <li>Accent colors for call-to-action and status highlights.</li>
                    <li>Neutral tones for typography and surface contrast.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Normalize and test accessibility</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Raw extracted palettes need normalization. Convert values to shared formats, remove near-duplicates, and run contrast
                    checks for text overlays. This step prevents beautiful but unusable combinations from reaching production.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Operationalize palette outputs</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Publish extracted colors as design tokens or CSS variables so product and marketing can reuse the same system. Include
                    metadata about source image and review date to keep historical campaigns auditable.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Campaign hero image
Need 6-color palette for landing page + ads`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`2 primary colors
2 accent colors
2 neutral support colors`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended image tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/image-color-extractor`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_color_extractor.title}
                    </Link>
                    <Link href={`/${locale}/image-color-picker`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_color_picker.title}
                    </Link>
                    <Link href={`/${locale}/image-average-color-finder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_average_color_finder.title}
                    </Link>
                    <Link href={`/${locale}/color-mixer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.color_mixer.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/svg-optimization-and-conversion-best-practices`}>
                        SVG optimization and conversion best practices
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/image-privacy-how-to-censor-and-protect-images`}>
                        Image privacy: how to censor and protect images
                    </Link>
                </p>
            </footer>
        </article>
    )
}
