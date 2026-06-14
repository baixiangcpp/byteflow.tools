"use client"

import { useLang } from "@/core/i18n/lang-provider"

export default function TermsPage() {
    const { t } = useLang()
    const p = t.pages

    const sections = [
        { title: p.terms_acceptance_title, desc: p.terms_acceptance_desc },
        { title: p.terms_use_title, desc: p.terms_use_desc },
        { title: p.terms_disclaimer_title, desc: p.terms_disclaimer_desc },
        { title: p.terms_liability_title, desc: p.terms_liability_desc },
        { title: p.terms_changes_title, desc: p.terms_changes_desc },
    ]

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <h1 className="text-3xl font-semibold tracking-tight">{p.terms_title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{p.terms_last_updated}</p>
            </section>

            <section className="grid gap-4">
                {sections.map((section) => (
                    <article key={section.title} className="rounded-2xl border border-border/70 bg-background/55 p-5">
                        <h2 className="text-lg font-semibold">{section.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.desc}</p>
                    </article>
                ))}
            </section>
        </div>
    )
}