import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function ConvertCurlToFetchPythonPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="convert-curl-to-fetch-python" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C2: API Debugging</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">How to convert cURL to fetch/Python</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    cURL commands capture real request intent, but direct copy into app code often drops headers, body encoding rules, or timeout
                    behavior. A deterministic conversion checklist prevents subtle regressions during SDK and client rewrites.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Conversion pitfalls to watch first</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Forgetting headers from <code>-H</code> flags when mapping to request objects.</li>
                    <li>Confusing <code>--data</code> (form/urlencoded) and JSON body semantics.</li>
                    <li>Dropping query string arguments during manual URL edits.</li>
                    <li>Missing timeout and retry behavior from shell wrappers.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input (cURL)</p>
                        <pre className="overflow-x-auto text-xs">{`curl -X POST https://api.example.com/v1/tasks \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"id":42}'`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output (fetch)</p>
                        <pre className="overflow-x-auto text-xs">{`await fetch("https://api.example.com/v1/tasks", {
  method: "POST",
  headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  body: JSON.stringify({ id: 42 }),
})`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Conversion workflow</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Normalize cURL command into one line and mark method, URL, headers, and body separately.</li>
                    <li>Generate target language snippet and compare every field one by one.</li>
                    <li>Replay both original and converted requests against a sandbox endpoint.</li>
                    <li>Store tested snippets in repo examples to avoid repeated manual translation.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for API request conversion</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/curl-to-code`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.curl_to_code.title}
                    </Link>
                    <Link href={`/${locale}/http-request-builder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.http_request_builder.title}
                    </Link>
                    <Link href={`/${locale}/openapi-viewer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.openapi_viewer.title}
                    </Link>
                    <Link href={`/${locale}/openapi-mock`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.openapi_mock.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/mock-openapi-quickly`}>
                        How to mock OpenAPI quickly
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/openapi-debugging-workflow-checklist`}>
                        OpenAPI debugging workflow checklist
                    </Link>
                </p>
            </footer>
        </article>
    )
}
