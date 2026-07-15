import Link from "next/link"
import { notFound } from "next/navigation"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LocalizedArticlePage } from "@/core/seo/components/localized-article-page"
import { StaticPageContainer } from "@/components/layout/page-container"

export default async function RobotsTxtTestingChecklistPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }
    const locale = lang
    const t = getTranslation(locale)

    if (locale !== "en") {
        return <LocalizedArticlePage locale={locale} slug="robots-txt-testing-checklist" />
    }

    return (
        <StaticPageContainer as="article" className="space-y-8">
            <header className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cluster C3: Network & Security</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">Robots.txt testing checklist</h1>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    One incorrect robots directive can suppress discovery of critical pages across locales. A pre-release checklist for robots
                    rules and crawler simulation prevents accidental deindexing during migrations and platform changes.
                </p>
            </header>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Pre-release robots checks</h2>
                <ul className="ml-5 list-disc space-y-2 text-sm leading-relaxed text-muted-foreground">
                    <li>Validate locale path access patterns and disallow rules for private paths only.</li>
                    <li>Verify sitemap declaration and canonical links remain crawlable.</li>
                    <li>Simulate crawler access for top landing pages and key tool routes.</li>
                    <li>Review environment-specific robots behavior before production deploy.</li>
                </ul>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Practical input/output example</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Input</p>
                        <pre className="overflow-x-auto text-xs">{`User-agent: *
Disallow: /`}</pre>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Output</p>
                        <pre className="overflow-x-auto text-xs">{`crawler access: blocked
indexing risk: critical`}</pre>
                    </div>
                </div>
            </section>

            <section className="space-y-4 rounded-2xl border border-border/70 bg-background/55 p-6">
                <h2 className="text-lg font-semibold">Tools for crawl integrity testing</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    <Link href={`/${locale}/robots-txt-tester`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.robots_txt_tester.title}
                    </Link>
                    <Link href={`/${locale}/certificate-decoder`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.certificate_decoder.title}
                    </Link>
                    <Link href={`/${locale}/csp-parser`} className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm hover:border-primary/35">
                        {t.tools.csp_parser.title}
                    </Link>
                </div>
            </section>

            <footer className="rounded-2xl border border-border/70 bg-card/55 p-6 text-sm text-muted-foreground">
                <p>
                    Next in cluster:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/dns-records-uptime`}>
                        How DNS records affect uptime
                    </Link>
                </p>
                <p className="mt-2">
                    Sibling read:{" "}
                    <Link className="text-foreground hover:text-primary" href={`/${locale}/certificate-chain-basics-for-developers`}>
                        Certificate chain basics for developers
                    </Link>
                </p>
            </footer>
        </StaticPageContainer>
    )
}
