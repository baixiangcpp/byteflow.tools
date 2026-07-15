import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function HashFunctionsComparedMd5VsSha256VsSha512Page({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="hash-functions-compared-md5-vs-sha256-vs-sha512" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C6: Encoding & Hashing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Hash functions compared: MD5 vs SHA-256 vs SHA-512</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Hash algorithms are frequently selected by habit rather than requirements. This article compares MD5, SHA-256, and
                    SHA-512 from a practical engineering lens: integrity checks, compatibility constraints, and security expectations.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Integrity vs cryptographic resistance</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    For non-adversarial integrity checks, teams may prioritize speed and compatibility. For security-sensitive workflows,
                    collision and preimage resistance become non-negotiable, which generally excludes MD5 from modern security contexts.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Practical selection guidance</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Use SHA-256 as a broad default for modern application checks.</li>
                    <li>Use SHA-512 when policy or platform requires higher digest width.</li>
                    <li>Use MD5 only for legacy interoperability where risk is accepted and documented.</li>
                </ul>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Selection should be encoded in architecture docs and lintable config to avoid accidental drift across services.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Operational pitfalls</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Hashing alone does not provide authenticity. If you need proof that data came from a trusted source, pair hashing with
                    signatures or HMAC. Also ensure identical input canonicalization across systems to prevent false mismatch incidents.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Deployment artifact + expected digest
Need: post-download integrity check`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Computed SHA-256 / SHA-512 digest
Pass or mismatch decision`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/hash-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.hash_generator.title}
                    </Link>
                    <Link href={`/${locale}/md5-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.md5_generator.title}
                    </Link>
                    <Link href={`/${locale}/sha256-digest-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        SHA-256 Digest Generator
                    </Link>
                    <Link href={`/${locale}/sha512-digest-generator`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        SHA-512 Digest Generator
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/url-encoding-explained-common-mistakes-and-solutions`}>
                        URL encoding explained: common mistakes and solutions
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/jwt-security-best-practices-for-token-handling`}>
                        JWT security: best practices for token handling
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
