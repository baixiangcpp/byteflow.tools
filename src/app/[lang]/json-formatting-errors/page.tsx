import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function JsonFormattingErrorsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="json-formatting-errors" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C1: JSON Ecosystem</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">JSON formatting errors and how to fix them</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Most JSON incidents are not caused by complex logic; they come from small syntax slips introduced during copy, manual edits,
                    or mixed formatting tools. This guide shows a repeatable path to isolate malformed JSON quickly and prevent it from reaching
                    API gateways, config loaders, and CI jobs.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Where malformed JSON starts</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    The most frequent breakpoints are trailing commas, unquoted keys, single quotes, and newline-escaped fragments copied from
                    logs. Another common failure pattern appears when teams merge sample payloads from multiple systems with different encoding
                    assumptions. UTF-8 issues and hidden control characters can make valid-looking input fail parser checks.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Production impact is bigger than a simple parse error: downstream retries spike, queue consumers dead-letter payloads, and
                    incident responders waste time proving whether the parser or the payload is wrong. A strict validation step before shipping
                    payload updates is usually the fastest way to cut this class of issues.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">A 5-step diagnostic workflow</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Start with the smallest reproducible object and confirm parser behavior on that minimal input.</li>
                    <li>Format first, then validate. Readable indentation surfaces structural mistakes faster than raw single-line blobs.</li>
                    <li>Check quote style and key syntax; JSON requires double quotes for keys and string values.</li>
                    <li>Strip hidden whitespace and control characters by pasting as plain text before rerunning validation.</li>
                    <li>Compare minified output against expected API contract samples before merging payload changes.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Fix patterns that prevent repeat incidents</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Store one canonical sample payload per endpoint in your repo and validate it in CI on every change.</li>
                    <li>Use formatter output in pull requests so reviewers inspect structure, not whitespace noise.</li>
                    <li>Reject hand-edited payloads without an attached validation result and parser version reference.</li>
                    <li>Document allowed optional fields explicitly to avoid ad-hoc key insertion during incidents.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Use this quick check pattern before merging payload updates.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`{"user":"ana","roles":["admin",],}`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`{"user":"ana","roles":["admin"]}`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools to use in this workflow</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/json-formatter`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_formatter.title}
                    </Link>
                    <Link href={`/${locale}/json-diff-viewer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_diff_viewer.title}
                    </Link>
                    <Link href={`/${locale}/jsonpath-playground`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jsonpath_playground.title}
                    </Link>
                    <Link href={`/${locale}/json-to-typescript`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.json_to_typescript.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/json-vs-json5-differences`}>
                        JSON vs JSON5 differences
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/validate-json-before-api-requests`}>
                        How to validate JSON before API requests
                    </Link>
                </p>
            </footer>
        </article>
    )
}
