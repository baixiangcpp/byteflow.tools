"use client"

import { useLang } from "@/core/i18n/lang-provider"
import { LocalDataControls } from "@/features/privacy/local-data-controls"

export default function PrivacyPage() {
    const { t } = useLang()
    const p = t.pages

    const sections = [
        { title: p.privacy_no_collection_title, desc: p.privacy_no_collection_desc },
        { title: p.privacy_cookies_title, desc: p.privacy_cookies_desc },
        { title: p.privacy_analytics_title, desc: p.privacy_analytics_desc },
        { title: p.privacy_third_party_title, desc: p.privacy_third_party_desc },
        { title: p.privacy_contact_title, desc: p.privacy_contact_desc },
    ]

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <h1 className="text-3xl font-semibold tracking-tight">{p.privacy_title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{p.privacy_last_updated}</p>
            </section>

            <section className="grid gap-4">
                {sections.map((section) => (
                    <article key={section.title} className="rounded-2xl border border-border/70 bg-background/55 p-5">
                        <h2 className="text-lg font-semibold">{section.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.desc}</p>
                    </article>
                ))}
                <LocalDataControls />
            </section>
        </div>
    )
}
