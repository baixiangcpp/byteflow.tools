import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function MockOpenapiQuicklyPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="mock-openapi-quickly" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C2: API Debugging</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">How to mock OpenAPI quickly</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Fast mocks unblock frontend and integration work before backend endpoints stabilize. The key is to keep mock output aligned
                    with operation IDs, response codes, and schema shapes so tests remain meaningful as specs evolve.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Fast mocking workflow</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Load OpenAPI spec and confirm request/response schema completeness.</li>
                    <li>Pick target endpoints and generate deterministic example payloads.</li>
                    <li>Serve mock responses with stable status codes and headers.</li>
                    <li>Update fixture snapshots when schema changes are approved.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`GET /users/{id}
response schema: User`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`200 application/json
{"id":"u_123","name":"Ava","role":"admin"}`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for OpenAPI mocking</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/openapi-mock`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.openapi_mock.title}
                    </Link>
                    <Link href={`/${locale}/openapi-viewer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.openapi_viewer.title}
                    </Link>
                    <Link href={`/${locale}/http-request-builder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.http_request_builder.title}
                    </Link>
                    <Link href={`/${locale}/curl-to-code`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.curl_to_code.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/openapi-debugging-workflow-checklist`}>
                        OpenAPI debugging workflow checklist
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/api-auth-header-mistakes`}>
                        Common API auth header mistakes
                    </Link>
                </p>
            </footer>
        </article>
    )
}
