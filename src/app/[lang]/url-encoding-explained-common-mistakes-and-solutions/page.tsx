import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function UrlEncodingExplainedCommonMistakesAndSolutionsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="url-encoding-explained-common-mistakes-and-solutions" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C6: Encoding & Hashing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">URL encoding explained: common mistakes and solutions</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    URL encoding bugs create subtle failures across APIs, redirects, and tracking links. Many issues come from encoding at
                    the wrong boundary or encoding twice. This guide gives practical rules that keep links and request parameters stable.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Encode data values, not full URLs</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    The most common mistake is applying URL encoding to an entire URL string. Encode only the dynamic parts (query values,
                    path segments) and leave URL structure delimiters intact.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Prevent double encoding</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    If one layer already encoded a value, a second pass can produce `%2520`-style artifacts. Establish ownership of encoding
                    responsibility at API boundaries and test round-trip decode paths in integration tests.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Document whether client or server performs the final encoding step.</li>
                    <li>Store canonical raw values and encode only at transport time.</li>
                    <li>Log decoded diagnostics in observability pipelines.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Keep parsing and validation aligned</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Parsing libraries and custom utilities can differ in handling plus signs, unicode, or reserved characters. Standardize
                    parser choice in shared utilities and use regression fixtures for edge cases.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Search value: "email + alias"
Need: query parameter for API call`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Encoded value only in query key
Server decodes to original string`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/url-encode-decode`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.url_encode_decode.title}
                    </Link>
                    <Link href={`/${locale}/url-parser`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.url_parser.title}
                    </Link>
                    <Link href={`/${locale}/curl-to-code`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.curl_to_code.title}
                    </Link>
                    <Link href={`/${locale}/http-request-builder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.http_request_builder.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/jwt-security-best-practices-for-token-handling`}>
                        JWT security: best practices for token handling
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/base64-encoding-when-and-how-to-use-it`}>
                        Base64 encoding: when and how to use it
                    </Link>
                </p>
            </footer>
        </article>
    )
}
