import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function CertificateChainBasicsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="certificate-chain-basics-for-developers" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C3: Network & Security</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Certificate chain basics for developers</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    TLS failures are often chain failures, not certificate-expiry failures. If intermediate certificates are missing or served in
                    the wrong order, clients that do not cache intermediates will fail handshakes even when your leaf certificate looks valid.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">How a certificate chain is validated</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Client validates the server certificate (leaf) against hostname and validity window.</li>
                    <li>Client walks through intermediate certificates up to a trusted root in its trust store.</li>
                    <li>If any intermediate is missing or mismatched, trust fails and TLS setup is aborted.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`leaf cert: valid
intermediate cert: missing
client trust store: standard`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`TLS handshake: failed
error: unable to get local issuer certificate`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Operational checks before release</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Verify full chain file order on edge/load balancer configuration.</li>
                    <li>Run handshake tests from multiple regions and client stacks.</li>
                    <li>Monitor certificate expiry and intermediate replacement windows together.</li>
                    <li>Keep rollback cert bundle ready for emergency renewals.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for TLS and DNS troubleshooting</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/certificate-decoder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.certificate_decoder.title}
                    </Link>
                    <Link href={`/${locale}/csp-parser`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.csp_parser.title}
                    </Link>
                    <Link href={`/${locale}/robots-txt-tester`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.robots_txt_tester.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/csp-mistakes-that-break-production`}>
                        CSP mistakes that break production
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/robots-txt-testing-checklist`}>
                        Robots.txt testing checklist
                    </Link>
                </p>
            </footer>
        </article>
    )
}
