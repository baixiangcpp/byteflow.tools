import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function JsonSchemaValidationChecklistPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="json-schema-validation-checklist" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C1: JSON Ecosystem</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">JSON schema validation checklist</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Contract drift between producers and consumers is one of the most common sources of API regressions. A schema checklist in
                    CI and runtime guards keeps payload expectations explicit and prevents silent type mismatches.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Checklist for production teams</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Version schemas and keep backward compatibility notes with each change.</li>
                    <li>Validate request and response payloads in CI for representative fixtures.</li>
                    <li>Reject unknown critical fields when strict mode is required.</li>
                    <li>Track validation failure rates by endpoint to detect contract drift early.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input schema rule</p>
                        <pre className="overflow-x-auto text-xs">{`"properties": {
  "amount": { "type": "number" }
}`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output validation</p>
                        <pre className="overflow-x-auto text-xs">{`payload: {"amount":"100"}
result: invalid (string vs number)`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for JSON contract quality</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/json-formatter`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_formatter.title}
                    </Link>
                    <Link href={`/${locale}/jsonpath-playground`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jsonpath_playground.title}
                    </Link>
                    <Link href={`/${locale}/json-to-typescript`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_to_typescript.title}
                    </Link>
                    <Link href={`/${locale}/json-diff-viewer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_diff_viewer.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/json-formatting-errors`}>
                        JSON formatting errors and how to fix them
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/json-vs-json5-differences`}>
                        JSON vs JSON5 differences
                    </Link>
                </p>
            </footer>
        </article>
    )
}
