import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function JwtSecurityBestPracticesForTokenHandlingPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="jwt-security-best-practices-for-token-handling" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C6: Encoding & Hashing</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">JWT security: best practices for token handling</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    JWT failures are usually operational, not theoretical: weak validation logic, poor key rotation, and unsafe storage
                    choices. This guide outlines practical controls that reduce incident risk in real production systems.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">1. Validate claims and signature consistently</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Verify signature algorithm, issuer, audience, and expiration on every protected request. Partial validation is a common
                    source of bypass vulnerabilities, especially in mixed-service environments.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">2. Design for key and token lifecycle control</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Rotate signing keys on a predictable schedule and keep token lifetimes short for high-risk actions. Add revocation and
                    replay mitigation plans where business impact justifies stricter controls.
                </p>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Short-lived access tokens for browser sessions.</li>
                    <li>Refresh-token protections with binding and revocation.</li>
                    <li>Audit logs for token issuance and failed verification events.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">3. Harden client storage and transport</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    Protect tokens with secure transport and carefully chosen storage strategies. No single storage model is universally best;
                    select based on threat model, platform constraints, and session ergonomics.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`Incoming JWT from API gateway
Need: verify before route access`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`Signature + claims validated
Allow or reject decision with audit log`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Recommended tools</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/jwt-decoder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jwt_decoder.title}
                    </Link>
                    <Link href={`/${locale}/jwt-workbench`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jwt_workbench.title}
                    </Link>
                    <Link href={`/${locale}/jwt-verifier`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.jwt_verifier.title}
                    </Link>
                    <Link href={`/${locale}/base64-encode-decode`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.base64_encode_decode.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/base64-encoding-when-and-how-to-use-it`}>
                        Base64 encoding: when and how to use it
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/hash-functions-compared-md5-vs-sha256-vs-sha512`}>
                        Hash functions compared: MD5 vs SHA-256 vs SHA-512
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
