import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function OpenapiDebuggingWorkflowChecklistPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="openapi-debugging-workflow-checklist" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C2: API Debugging</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">OpenAPI debugging workflow checklist</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Many API bugs are contract alignment issues between spec, client, and service behavior. A repeatable debugging checklist
                    helps teams isolate whether the mismatch is in path params, payload schema, auth config, or response assumptions.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Debug in this order</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Confirm the exact OpenAPI operation and expected request shape.</li>
                    <li>Replay request with deterministic tooling and capture raw headers/body.</li>
                    <li>Compare actual response code and schema against documented contract.</li>
                    <li>Patch either spec or implementation, then re-run contract checks.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`spec: POST /orders -> 201
actual: POST /orders -> 200`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`contract mismatch found
action: align response status in service or spec`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for contract debugging</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/openapi-viewer`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.openapi_viewer.title}
                    </Link>
                    <Link href={`/${locale}/openapi-mock`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.openapi_mock.title}
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
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/api-auth-header-mistakes`}>
                        Common API auth header mistakes
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/convert-curl-to-fetch-python`}>
                        How to convert cURL to fetch/Python
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
