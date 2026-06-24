import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, ExternalLink, FileText, Github, LockKeyhole, Network, ShieldCheck, WifiOff } from "lucide-react"
import { isValidLocale, requireTranslationValue } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TOOL_REGISTRY } from "@/core/registry"
import { JsonLdScript } from "@/core/seo/components/json-ld-script"
import { SITE_URL, buildCanonicalUrl } from "@/core/seo/urls"

const SECURITY_ADVISORY_URL = "https://github.com/baixiangcpp/byteflow.tools/security/advisories/new"
const GITHUB_REPO_URL = "https://github.com/baixiangcpp/byteflow.tools"
const SECURITY_TXT_URL = "/.well-known/security.txt"

function TrustPill({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <article className="rounded-lg border border-border/70 bg-background/55 p-4">
            <div className="flex gap-3">
                <span className="mt-0.5 text-primary" aria-hidden="true">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
            </div>
        </article>
    )
}

export default async function TrustCenterPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params
    if (!isValidLocale(lang)) {
        notFound()
    }

    const locale = lang
    const t = getTranslation(locale)
    const p = t.pages
    const common = t.common
    const toolCopy = t.tools as Record<string, { title?: string }>
    const externalTools = TOOL_REGISTRY
        .filter((tool) => tool.privacy.externalRequest.required)
        .map((tool) => ({
            tool,
            title: requireTranslationValue(toolCopy[tool.key]?.title, `tools.${tool.key}.title`),
            purpose: tool.privacy.externalRequest.purposeKey
                ? common.external_network_notice.purposes?.[tool.privacy.externalRequest.purposeKey as keyof typeof common.external_network_notice.purposes]
                : undefined,
            dataSent: tool.privacy.externalRequest.userDataSent
                ? common.external_network_notice.external_data?.[tool.privacy.externalRequest.userDataSent as keyof typeof common.external_network_notice.external_data]
                : undefined,
        }))
        .sort((a, b) => a.title.localeCompare(b.title, locale))

    const faq = [
        { q: p.trust_center_faq_q1, a: p.trust_center_faq_a1 },
        { q: p.trust_center_faq_q2, a: p.trust_center_faq_a2 },
        { q: p.trust_center_faq_q3, a: p.trust_center_faq_a3 },
    ]
    const offlineMatrix = [
        {
            type: p.trust_center_offline_matrix_local_type,
            behavior: p.trust_center_offline_matrix_local_behavior,
            cache: p.trust_center_offline_matrix_local_cache,
        },
        {
            type: p.trust_center_offline_matrix_file_type,
            behavior: p.trust_center_offline_matrix_file_behavior,
            cache: p.trust_center_offline_matrix_file_cache,
        },
        {
            type: p.trust_center_offline_matrix_pipeline_type,
            behavior: p.trust_center_offline_matrix_pipeline_behavior,
            cache: p.trust_center_offline_matrix_pipeline_cache,
        },
        {
            type: p.trust_center_offline_matrix_external_type,
            behavior: p.trust_center_offline_matrix_external_behavior,
            cache: p.trust_center_offline_matrix_external_cache,
        },
    ]
    const url = buildCanonicalUrl(locale, "trust-center")
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${url}#webpage`,
                name: p.trust_center_title,
                description: p.trust_center_intro,
                url,
                inLanguage: locale,
                isPartOf: { "@id": `${SITE_URL}/#website` },
                publisher: { "@id": `${SITE_URL}/#organization` },
            },
            {
                "@type": "BreadcrumbList",
                itemListElement: [
                    {
                        "@type": "ListItem",
                        position: 1,
                        name: requireTranslationValue(t.nav.home, "nav.home"),
                        item: buildCanonicalUrl(locale),
                    },
                    {
                        "@type": "ListItem",
                        position: 2,
                        name: p.trust_center_title,
                        item: url,
                    },
                ],
            },
            {
                "@type": "FAQPage",
                mainEntity: faq.map((item) => ({
                    "@type": "Question",
                    name: item.q,
                    acceptedAnswer: {
                        "@type": "Answer",
                        text: item.a,
                    },
                })),
            },
        ],
    }

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <JsonLdScript data-jsonld="trust-center" jsonLd={jsonLd} />

            <section className="rounded-lg border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    byteflow.tools
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{p.trust_center_title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {p.trust_center_intro}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                        href={`/${locale}/privacy`}
                        className="inline-flex min-h-10 items-center rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {p.privacy_title}
                    </Link>
                    <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Github className="h-4 w-4" aria-hidden="true" />
                        {p.trust_center_source_link}
                    </a>
                    <a
                        href={SECURITY_TXT_URL}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        {p.trust_center_securitytxt_link}
                    </a>
                    <a
                        href="#offline-support-matrix"
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <WifiOff className="h-4 w-4" aria-hidden="true" />
                        {p.trust_center_offline_matrix_link}
                    </a>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-3" aria-label={p.trust_center_title}>
                <TrustPill
                    icon={<ShieldCheck className="h-5 w-5" />}
                    title={p.trust_center_summary_local_title}
                    description={p.trust_center_summary_local_desc}
                />
                <TrustPill
                    icon={<Network className="h-5 w-5" />}
                    title={p.trust_center_summary_network_title}
                    description={p.trust_center_summary_network_desc}
                />
                <TrustPill
                    icon={<LockKeyhole className="h-5 w-5" />}
                    title={p.trust_center_summary_security_title}
                    description={p.trust_center_summary_security_desc}
                />
            </section>

            <section className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{p.trust_center_labels_title}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TrustPill
                        icon={<ShieldCheck className="h-5 w-5" />}
                        title={common.tool_trust_header.browser_local_label}
                        description={p.trust_center_browser_local_desc}
                    />
                    <TrustPill
                        icon={<WifiOff className="h-5 w-5" />}
                        title={common.tool_trust_header.offline_label}
                        description={p.trust_center_offline_desc}
                    />
                    <TrustPill
                        icon={<ExternalLink className="h-5 w-5" />}
                        title={common.tool_trust_header.external_request_label}
                        description={p.trust_center_external_request_desc}
                    />
                    <TrustPill
                        icon={<LockKeyhole className="h-5 w-5" />}
                        title={common.tool_trust_header.sensitive_label}
                        description={p.trust_center_sensitive_input_desc}
                    />
                </div>
            </section>

            <section id="verify-local-processing" className="rounded-lg border border-border/70 bg-card/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{p.trust_center_verify_title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.trust_center_verify_intro}</p>
                <ol className="mt-4 grid gap-3 md:grid-cols-2">
                    {[p.trust_center_verify_step1, p.trust_center_verify_step2, p.trust_center_verify_step3, p.trust_center_verify_step4].map((step, index) => (
                        <li key={step} className="flex gap-3 rounded-lg border border-border/70 bg-background/55 p-3 text-sm text-muted-foreground">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-primary/35 bg-primary/10 text-xs font-semibold text-primary">
                                {index + 1}
                            </span>
                            <span>{step}</span>
                        </li>
                    ))}
                </ol>
            </section>

            <section id="offline-support-matrix" className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{p.trust_center_offline_matrix_title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.trust_center_offline_matrix_desc}</p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-border/70">
                    <table className="min-w-full divide-y divide-border/70 text-left text-sm" aria-label={p.trust_center_offline_matrix_title}>
                        <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th scope="col" className="px-3 py-2">{p.trust_center_offline_matrix_col_type}</th>
                                <th scope="col" className="px-3 py-2">{p.trust_center_offline_matrix_col_behavior}</th>
                                <th scope="col" className="px-3 py-2">{p.trust_center_offline_matrix_col_cache}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70 bg-card/35">
                            {offlineMatrix.map((row) => (
                                <tr key={row.type}>
                                    <th scope="row" className="px-3 py-3 font-medium text-foreground">{row.type}</th>
                                    <td className="px-3 py-3 text-muted-foreground">{row.behavior}</td>
                                    <td className="px-3 py-3 text-muted-foreground">{row.cache}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-background/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{p.trust_center_external_tools_title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.trust_center_external_tools_desc}</p>
                <div className="mt-4 overflow-x-auto rounded-lg border border-border/70">
                    <table className="min-w-full divide-y divide-border/70 text-left text-sm" aria-label={p.trust_center_external_tools_title}>
                        <thead className="bg-muted/45 text-xs uppercase tracking-wide text-muted-foreground">
                            <tr>
                                <th scope="col" className="px-3 py-2">{p.trust_center_external_tool_col_tool}</th>
                                <th scope="col" className="px-3 py-2">{p.trust_center_external_tool_col_domains}</th>
                                <th scope="col" className="px-3 py-2">{p.trust_center_external_tool_col_purpose}</th>
                                <th scope="col" className="px-3 py-2">{p.trust_center_external_tool_col_data}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70 bg-card/35">
                            {externalTools.map(({ tool, title, purpose, dataSent }) => (
                                <tr key={tool.key}>
                                    <td className="px-3 py-3 font-medium text-foreground">
                                        <Link className="hover:text-primary" href={`/${locale}/${tool.slug}`}>
                                            {title}
                                        </Link>
                                    </td>
                                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                                        {(tool.privacy.externalRequest.domains ?? []).join(", ")}
                                    </td>
                                    <td className="px-3 py-3 text-muted-foreground">{purpose ?? tool.privacy.externalRequest.disclosure}</td>
                                    <td className="px-3 py-3 text-muted-foreground">{dataSent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                {[
                    { title: p.trust_center_storage_title, desc: p.trust_center_storage_desc },
                    { title: p.trust_center_analytics_title, desc: p.trust_center_analytics_desc },
                    { title: p.trust_center_pwa_title, desc: p.trust_center_pwa_desc },
                    { title: p.trust_center_security_headers_title, desc: p.trust_center_security_headers_desc },
                    { title: p.trust_center_xss_title, desc: p.trust_center_xss_desc },
                    { title: p.trust_center_vulnerability_title, desc: p.trust_center_vulnerability_desc },
                ].map((item) => (
                    <article key={item.title} className="rounded-lg border border-border/70 bg-background/55 p-5">
                        <h2 className="text-lg font-semibold">{item.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-lg border border-border/70 bg-card/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{p.trust_center_faq_title}</h2>
                <div className="mt-4 grid gap-3">
                    {faq.map((item) => (
                        <details key={item.q} className="rounded-lg border border-border/70 bg-background/55 p-3">
                            <summary className="cursor-pointer text-sm font-medium">{item.q}</summary>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                        </details>
                    ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                    <a
                        href={SECURITY_ADVISORY_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {p.trust_center_vulnerability_link}
                    </a>
                    <a
                        href={GITHUB_REPO_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <Github className="h-4 w-4" aria-hidden="true" />
                        {p.trust_center_source_link}
                    </a>
                    <a
                        href={SECURITY_TXT_URL}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <FileText className="h-4 w-4" aria-hidden="true" />
                        {p.trust_center_securitytxt_link}
                    </a>
                </div>
            </section>
        </div>
    )
}
