import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function ValidateJsonBeforeApiRequestsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="validate-json-before-api-requests" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C1: JSON Ecosystem</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">How to validate JSON before API requests</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    The fastest way to reduce API incident noise is to validate payloads before they leave client code or job workers.
                    A lightweight preflight checklist catches syntax, schema, and encoding issues before they become retries and alerts.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Validation checkpoints that matter</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Run strict parser validation after formatting.</li>
                    <li>Check required fields and type expectations against the API contract.</li>
                    <li>Verify UTF-8 and remove hidden control characters from copied input.</li>
                    <li>Compare a minified transport payload with expected schema examples.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`{
  "id": "42",
  "enabled": "true"
}`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`schema check: failed
reason: enabled must be boolean`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools to enforce preflight checks</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/json-formatter`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_formatter.title}
                    </Link>
                    <Link href={`/${locale}/json-diff-viewer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_diff_viewer.title}
                    </Link>
                    <Link href={`/${locale}/json-to-typescript`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_to_typescript.title}
                    </Link>
                    <Link href={`/${locale}/jsonpath-playground`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jsonpath_playground.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/json-schema-validation-checklist`}>
                        JSON schema validation checklist
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/json-formatting-errors`}>
                        JSON formatting errors and how to fix them
                    </Link>
                </p>
            </footer>
        </article>
    )
}
