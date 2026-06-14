"use client"

import { useLang } from "@/core/i18n/lang-provider"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Github, Mail, MessageSquare, ExternalLink } from "lucide-react"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const EMAIL_ADDRESS = "contact@byteflow.tools"
const GITHUB_REPOSITORY_URL = "https://github.com/baixiangcpp/byteflow.tools"
const GITHUB_ISSUES_URL = "https://github.com/baixiangcpp/byteflow.tools/issues"

export default function ContactPage() {
    const { t } = useLang()
    const p = t.pages

    const links = [
        { icon: Github, title: "GitHub", desc: p.contact_github_desc, href: GITHUB_REPOSITORY_URL, external: true },
        { icon: MessageSquare, title: p.contact_issues_title, desc: p.contact_issues_desc, href: GITHUB_ISSUES_URL, external: true },
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
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <h1 className="text-3xl font-semibold tracking-tight">{p.contact_title}</h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.contact_intro}</p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {links.map((link) => (
                    <a
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
                    </a>
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
        </div>
    )
}
