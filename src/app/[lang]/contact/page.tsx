"use client"

import Link from "next/link"
import { useLang } from "@/core/i18n/lang-provider"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Github, Mail, MessageSquare, ExternalLink, ShieldCheck, Map, ThumbsUp, HeartHandshake } from "lucide-react"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"
import { StaticPageContainer } from "@/components/layout/page-container"

const EMAIL_ADDRESS = "contact@byteflow.tools"
const GITHUB_REPOSITORY_URL = "https://github.com/baixiangcpp/byteflow.tools"
const GITHUB_ISSUES_URL = "https://github.com/baixiangcpp/byteflow.tools/issues"
const GITHUB_FEATURE_REQUEST_URL = "https://github.com/baixiangcpp/byteflow.tools/issues/new?template=feature_request.yml"
const GITHUB_REQUEST_VOTING_URL = "https://github.com/baixiangcpp/byteflow.tools/issues?q=is%3Aissue%20is%3Aopen%20label%3Aenhancement"
const SECURITY_ADVISORY_URL = "https://github.com/baixiangcpp/byteflow.tools/security/advisories/new"

export default function ContactPage() {
    const { t, lang } = useLang()
    const p = t.pages

    const links = [
        { icon: Github, title: "GitHub", desc: p.contact_github_desc, href: GITHUB_REPOSITORY_URL, external: true },
        { icon: MessageSquare, title: p.contact_issues_title, desc: p.contact_issues_desc, href: GITHUB_ISSUES_URL, external: true },
        { icon: Map, title: t.common.request_tool, desc: p.contact_request_tool_desc, href: GITHUB_FEATURE_REQUEST_URL, external: true },
        { icon: ThumbsUp, title: t.common.vote_on_requests, desc: p.contact_vote_requests_desc, href: GITHUB_REQUEST_VOTING_URL, external: true },
        { icon: ShieldCheck, title: p.contact_security_title, desc: p.contact_security_desc, href: SECURITY_ADVISORY_URL, external: true },
        { icon: HeartHandshake, title: p.support_title, desc: p.contact_support_desc, href: `/${lang}/support`, external: false },
    ]

    const handleCopyEmail = async () => {
        const result = await safeClipboardWrite(EMAIL_ADDRESS)
        if (!result.ok) {
            toast.error(t.common.copy_failed)
            return
        }
        toast.success(t.common.copied, {
            description: EMAIL_ADDRESS,
        })
    }

    return (
        <StaticPageContainer className="space-y-8">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <h1 className="text-3xl font-semibold tracking-tight">{p.contact_title}</h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.contact_intro}</p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {links.map((link) => (
                    <Link
                        key={link.title}
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="group rounded-2xl border border-border/70 bg-background/55 p-5 transition-colors duration-200 hover:border-primary/35"
                    >
                        <div className="flex items-center justify-between">
                            <link.icon className="h-5 w-5 text-primary" />
                            {link.external && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />}
                        </div>
                        <h2 className="mt-3 text-sm font-semibold">{link.title}</h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{link.desc}</p>
                    </Link>
                ))}
                <div className="group rounded-2xl border border-border/70 bg-background/55 p-5 transition-colors duration-200 hover:border-primary/35">
                    <div className="flex items-center justify-between">
                        <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="mt-3 text-sm font-semibold">{p.contact_email_title}</h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{p.contact_email_desc}</p>
                    <Button className="mt-3 w-full" variant="outline" size="sm" onClick={handleCopyEmail}>
                        {p.contact_email_title}
                    </Button>
                </div>
            </section>

            <section className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
                <h2 className="text-lg font-semibold">{p.contact_public_planning_title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                    {p.contact_public_planning_desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                        href={`/${lang}/roadmap`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {p.contact_roadmap_link}
                    </Link>
                    <Link
                        href={`/${lang}/distribution-research`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {p.contact_distribution_research_link}
                    </Link>
                    <Link
                        href={`/${lang}/self-hosting`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {p.contact_self_hosting_link}
                    </Link>
                    <Link
                        href={`/${lang}/support`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {p.support_title}
                    </Link>
                </div>
            </section>
        </StaticPageContainer>
    )
}
