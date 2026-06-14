import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function ImagePrivacyHowToCensorAndProtectImagesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="image-privacy-how-to-censor-and-protect-images" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C5: Image Processing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Image privacy: how to censor and protect images</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Screenshots and photos often include sensitive fields that users overlook under delivery pressure. A privacy-first image
                    workflow reduces accidental data exposure by making redaction and verification mandatory steps before sharing.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Identify high-risk regions early</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    During capture or upload, identify personally identifiable information, API keys, account numbers, and internal URLs.
                    Mark these zones before editing starts so every stakeholder reviews the same privacy boundary.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Choose irreversible redaction by default</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Blur effects can be partially reversible with aggressive image processing. For highly sensitive content, prefer solid
                    block redaction or crop removal, then export flattened outputs to prevent layer recovery.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Use crop when the hidden region is not needed for context.</li>
                    <li>Use solid masks for credentials and personal identifiers.</li>
                    <li>Use blur only for low-sensitivity visual obfuscation.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Verify before distribution</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Run a final zoom-level review and check metadata exposure risk before publishing to docs, tickets, or social channels.
                    This final pass is low cost and prevents high-impact incidents caused by rushed uploads.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Support screenshot with email + token
Need to share in public issue`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Sensitive fields fully redacted
Cropped and compressed share-safe image`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended image tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/photo-censor`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.photo_censor.title}
                    </Link>
                    <Link href={`/${locale}/image-cropper`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_cropper.title}
                    </Link>
                    <Link href={`/${locale}/image-filters`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_filters.title}
                    </Link>
                    <Link href={`/${locale}/image-resizer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_resizer.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/image-optimization-for-web-complete-workflow`}>
                        Image optimization for web: complete workflow
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/color-extraction-from-images-use-cases-and-tools`}>
                        Color extraction from images: use cases and tools
                    </Link>
                </p>
            </footer>
        </article>
    )
}
