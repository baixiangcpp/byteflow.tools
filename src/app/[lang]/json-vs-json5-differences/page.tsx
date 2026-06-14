import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function JsonVsJson5DifferencesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="json-vs-json5-differences" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C1: JSON Ecosystem</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">JSON vs JSON5 differences</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    JSON5 improves authoring ergonomics with comments, trailing commas, and unquoted keys, but many production parsers still
                    expect strict JSON. Teams that do not separate authoring format and transport format often hit avoidable runtime failures.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Syntax differences that matter in production</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>JSON requires double-quoted keys and strings; JSON5 allows unquoted keys and single quotes.</li>
                    <li>JSON disallows trailing commas; JSON5 allows them in objects and arrays.</li>
                    <li>JSON has no comments; JSON5 supports inline and block comments.</li>
                    <li>Many API gateways and validation libraries only accept strict JSON payloads.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Migration rule of thumb</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Use JSON5 only as an authoring layer in developer-facing config files. Before anything crosses network boundaries, compile or
                    normalize to strict JSON and validate with your target parser version. This keeps developer convenience while preserving
                    transport compatibility and predictable schema checks.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input (JSON5)</p>
                        <pre className="overflow-x-auto text-xs">{`{
  apiHost: 'https://api.example.com',
  retry: 3,
}`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output (JSON)</p>
                        <pre className="overflow-x-auto text-xs">{`{
  "apiHost": "https://api.example.com",
  "retry": 3
}`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for format validation and conversion</h2>
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
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/validate-json-before-api-requests`}>
                        How to validate JSON before API requests
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/json-schema-validation-checklist`}>
                        JSON schema validation checklist
                    </Link>
                </p>
            </footer>
        </article>
    )
}
