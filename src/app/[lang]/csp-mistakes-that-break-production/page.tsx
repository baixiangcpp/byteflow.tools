import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"

export default async function CspMistakesThatBreakProductionPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="csp-mistakes-that-break-production" />
    }

    return (
        <article className="mx-auto w-full max-w-4xl space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C3: Network & Security</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">CSP mistakes that break production</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Content Security Policy is essential for reducing XSS risk, but a strict policy shipped without staged validation can block
                    critical scripts and integrations. The safest path is to iterate from report-only into enforced rules with clear monitoring.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Common high-impact CSP mistakes</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Blocking required inline scripts without nonce/hash migration.</li>
                    <li>Forgetting third-party domains for auth, analytics, or payment flows.</li>
                    <li>Using wildcard sources in production and assuming equivalent security.</li>
                    <li>Skipping report pipeline analysis before enforcing a strict policy.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input policy</p>
                        <pre className="overflow-x-auto text-xs">{`script-src 'self';
connect-src 'self';`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output behavior</p>
                        <pre className="overflow-x-auto text-xs">{`payment SDK blocked
auth callback blocked`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for CSP hardening</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/csp-parser`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.csp_parser.title}
                    </Link>
                    <Link href={`/${locale}/certificate-decoder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.certificate_decoder.title}
                    </Link>
                    <Link href={`/${locale}/robots-txt-tester`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.robots_txt_tester.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/robots-txt-testing-checklist`}>
                        Robots.txt testing checklist
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/dns-records-uptime`}>
                        How DNS records affect uptime
                    </Link>
                </p>
            </footer>
        </article>
    )
}
