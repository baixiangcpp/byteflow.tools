import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowUpRight, CheckCircle2, HeartHandshake, Mail, ServerCog, ShieldCheck } from "lucide-react"
import { isValidLocale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { StaticPageContainer } from "@/components/layout/page-container"

const EMAIL_ADDRESS = "contact@byteflow.tools"
const GITHUB_REPOSITORY_URL = "https://github.com/baixiangcpp/byteflow.tools"

export default async function SupportPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params
    if (!isValidLocale(lang)) notFound()
    const t = getTranslation(lang)
    const p = t.pages

    const boundaries = [
        p.support_boundary_free,
        p.support_boundary_no_tracking,
        p.support_boundary_no_payload,
        p.support_boundary_no_account,
    ]

    return (
        <StaticPageContainer className="space-y-8">
            <section className="rounded-lg border border-border/70 bg-card/55 p-6 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{p.support_badge}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{p.support_title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {p.support_intro}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                    <a
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={`mailto:${EMAIL_ADDRESS}?subject=${encodeURIComponent(p.support_title)}`}
                    >
                        <Mail className="h-4 w-4" aria-hidden="true" />
                        {p.support_cta_email}
                    </a>
                    <Link
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        href={`/${lang}/self-hosting`}
                    >
                        <ServerCog className="h-4 w-4" aria-hidden="true" />
                        {p.self_hosting_title}
                    </Link>
                </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
                <article className="rounded-lg border border-border/70 bg-background/55 p-5">
                    <HeartHandshake className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-semibold">{p.support_sponsor_title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {p.support_sponsor_desc}
                    </p>
                </article>
                <article className="rounded-lg border border-border/70 bg-background/55 p-5">
                    <ServerCog className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="mt-3 text-lg font-semibold">{p.support_private_deployment_title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {p.support_private_deployment_desc}
                    </p>
                </article>
            </section>

            <section className="rounded-lg border border-primary/30 bg-primary/10 p-5 sm:p-6">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="mt-3 text-lg font-semibold">{p.support_boundaries_title}</h2>
                <ul className="mt-4 space-y-3">
                    {boundaries.map((item) => (
                        <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
                <a
                    className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    href={GITHUB_REPOSITORY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {p.support_cta_github}
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
            </section>
        </StaticPageContainer>
    )
}
