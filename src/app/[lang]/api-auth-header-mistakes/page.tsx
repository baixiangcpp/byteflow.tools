import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function ApiAuthHeaderMistakesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="api-auth-header-mistakes" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C2: API Debugging</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Common API auth header mistakes</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Authentication failures often look like backend bugs but start at the request edge: malformed Authorization headers,
                    missing prefixes, stale signatures, or token strings encoded with the wrong strategy. This page gives a practical way
                    to isolate header-level issues before escalating to service owners.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">High-frequency failure patterns</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Bearer token sent without the <code>Bearer </code> prefix.</li>
                    <li>Whitespace or line breaks introduced while copying secrets from dashboards.</li>
                    <li>Timestamp skew in signed requests causing immediate signature invalidation.</li>
                    <li>Header key casing mismatch in custom gateway or proxy transformations.</li>
                    <li>Double-encoding query or body values used in HMAC canonical strings.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Debug checklist before escalation</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Capture raw outgoing request headers from client or edge logs.</li>
                    <li>Verify token structure and expiration manually before replaying requests.</li>
                    <li>Rebuild the request with a deterministic tool so hidden mutations are visible.</li>
                    <li>Compare canonical payload, timestamp, nonce, and signature inputs one-by-one.</li>
                    <li>Only escalate after you can reproduce the failure with minimal deterministic inputs.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Team-level prevention controls</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Add preflight checks in local tooling and CI for token format, header presence, and signing prerequisites. Keep one trusted
                    request fixture per auth scheme and run it whenever client SDK or gateway config changes. In incident playbooks, require
                    responders to capture both raw request and canonical signing inputs so root cause analysis is fast and reproducible.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Validate the Authorization header structure before escalating token issues.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Authorization: eyJhbGciOiJIUzI1NiJ9...`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for auth-header debugging</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/http-request-builder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.http_request_builder.title}
                    </Link>
                    <Link href={`/${locale}/curl-to-code`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.curl_to_code.title}
                    </Link>
                    <Link href={`/${locale}/jwt-decoder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jwt_decoder.title}
                    </Link>
                    <Link href={`/${locale}/url-encode-decode`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.url_encode_decode.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/convert-curl-to-fetch-python`}>
                        How to convert cURL to fetch/Python
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/mock-openapi-quickly`}>
                        How to mock OpenAPI quickly
                    </Link>
                </p>
            </footer>
        </article>
    )
}
