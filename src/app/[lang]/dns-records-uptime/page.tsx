import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function DnsRecordsUptimePage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="dns-records-uptime" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C3: Network & Security</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">How DNS records affect uptime</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    DNS is often treated as static infrastructure, but small record or TTL mistakes can amplify downtime during deploys,
                    certificate rotations, and failovers. This guide explains where DNS decisions directly influence user-visible outages
                    and what operational checks reduce risk.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">What creates DNS-related downtime</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>TTL values that are too long during endpoint migrations.</li>
                    <li>Inconsistent A/AAAA records between primary and secondary DNS providers.</li>
                    <li>Dangling CNAME chains after certificate or ingress changes.</li>
                    <li>Manual edits performed without propagation-aware rollout windows.</li>
                    <li>Missing monitoring for resolution failures at regional resolvers.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Propagation-aware deployment workflow</h2>
                <ol className="ml-5 list-decimal space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Reduce TTL well ahead of the change window to shorten resolver cache persistence.</li>
                    <li>Pre-create target records and validate certificate chain readiness before traffic switch.</li>
                    <li>Apply DNS updates in a controlled window and monitor regional resolution paths.</li>
                    <li>Track both DNS resolution and application health signals to avoid false recoveries.</li>
                    <li>After stabilization, restore baseline TTL values and archive a rollout timeline.</li>
                </ol>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Post-incident learning checklist</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    For every DNS-related incident, capture the exact record diff, TTL changes, resolver samples, and the delay between change
                    and recovery. Teams that keep this data can tune runbooks, set safer maintenance windows, and avoid repeating high-impact
                    rollback loops during future outages.
                </p>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                    A small TTL adjustment before migrations can materially reduce visible downtime.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`A record TTL: 3600
cutover window: 10:00 UTC`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`A record TTL: 300 (24h before cutover)
propagation risk: reduced`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for DNS and security troubleshooting</h2>
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
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/certificate-chain-basics-for-developers`}>
                        Certificate chain basics for developers
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/csp-mistakes-that-break-production`}>
                        CSP mistakes that break production
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
