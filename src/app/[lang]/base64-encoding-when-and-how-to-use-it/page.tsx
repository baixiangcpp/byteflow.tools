import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function Base64EncodingWhenAndHowToUseItPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="base64-encoding-when-and-how-to-use-it" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C6: Encoding & Hashing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Base64 encoding: when and how to use it</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Base64 appears in APIs, tokens, and data transport layers, but it is often misunderstood. It is an encoding format,
                    not encryption. This guide clarifies valid use cases, tradeoffs, and anti-patterns so teams can apply Base64 with
                    predictable results.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Choose Base64 for transport compatibility</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Base64 is useful when binary data must travel through text-oriented channels. It helps avoid control-character issues
                    and preserves payload integrity in systems that expect printable characters.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Embedding compact binary data into JSON fields.</li>
                    <li>Passing opaque values through systems with text-only constraints.</li>
                    <li>Serializing artifacts for copy-paste workflows.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Account for size overhead</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Base64 increases payload size by roughly one-third. For large assets this can materially affect transfer cost, caching,
                    and render path latency. For high-volume media pipelines, prefer original binary delivery whenever possible.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Separate encoding from security controls</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Teams sometimes treat Base64 output as secure because it looks unreadable. It is trivially reversible, so sensitive
                    payloads still require encryption, access control, and token lifecycle safeguards.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Binary file bytes or image blob
Need: JSON-safe transfer field`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Base64 string for transport
Decoded back to original bytes`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/base64-encode-decode`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.base64_encode_decode.title}
                    </Link>
                    <Link href={`/${locale}/image-base64`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.image_base64.title}
                    </Link>
                    <Link href={`/${locale}/url-encode-decode`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.url_encode_decode.title}
                    </Link>
                    <Link href={`/${locale}/jwt-decoder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jwt_decoder.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/hash-functions-compared-md5-vs-sha256-vs-sha512`}>
                        Hash functions compared: MD5 vs SHA-256 vs SHA-512
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/url-encoding-explained-common-mistakes-and-solutions`}>
                        URL encoding explained: common mistakes and solutions
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
