"use client"

import Link from "next/link"
import { useLang } from "@/core/i18n/lang-provider"
import { Github, Globe, Code2, Zap, Shield, ArrowUpRight } from "lucide-react"

export default function AboutPage() {
    const { t, lang } = useLang()
    const p = t.pages

    const highlights = [
        { icon: Shield, title: p.about_privacy_title, desc: p.about_privacy_desc },
        { icon: Zap, title: p.about_fast_title, desc: p.about_fast_desc },
        { icon: Code2, title: p.about_oss_title, desc: p.about_oss_desc },
    ]

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <h1 className="text-3xl font-semibold tracking-tight">{p.about_title}</h1>
                <p className="mt-3 text-base leading-relaxed text-muted-foreground">{p.about_intro}</p>
            </section>

            <section id="privacy" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {highlights.map((item) => (
                    <article
                        key={item.title}
                        className="rounded-2xl border border-border/70 bg-background/55 p-5 transition-colors duration-200 hover:border-primary/30"
                    >
                        <item.icon className="h-5 w-5 text-primary" />
                        <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
                        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold">{p.about_stack_title}</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                    {["Next.js 16", "React 19", "TypeScript", "Shadcn UI", "Tailwind CSS", "Monaco Editor", "Web Crypto API"].map((tech) => (
                        <span key={tech} className="rounded-full border border-border/70 bg-background/55 px-3 py-1.5 text-xs text-muted-foreground">
                            {tech}
                        </span>
                    ))}
                </div>
            </section>

            <section className="flex flex-wrap items-center gap-3 pt-1">
                <a
                    href="https://github.com/baixiangcpp/byteflow.tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/75 bg-background/55 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Github className="h-4 w-4" />
                    GitHub
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <Link
                    href={`/${lang}/trust-center`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/75 bg-background/55 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Shield className="h-4 w-4" />
                    {p.trust_center_title}
                </Link>
                <Link
                    href={`/${lang}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/75 bg-background/55 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Globe className="h-4 w-4" />
                    {p.about_explore}
                </Link>
            </section>
        </div>
    )
}
