"use client"

import Link from "next/link"
import { useLang } from "@/core/i18n/lang-provider"
import { TOOL_REGISTRY } from "@/core/registry"
import { LocalDataControls } from "@/features/privacy/local-data-controls"

export default function PrivacyPage() {
    const { t, lang } = useLang()
    const p = t.pages

    const sections = [
        { title: p.privacy_no_collection_title, desc: p.privacy_no_collection_desc },
        { title: p.privacy_cookies_title, desc: p.privacy_cookies_desc },
        { title: p.privacy_analytics_title, desc: p.privacy_analytics_desc },
        { title: p.privacy_third_party_title, desc: p.privacy_third_party_desc },
        { title: p.privacy_contact_title, desc: p.privacy_contact_desc },
    ]
    const toolTranslations = t.tools as Record<string, { title?: string }>
    const externalRequestTools = TOOL_REGISTRY.filter((tool) => tool.privacy.externalRequest.required)

    return (
        <div className="mx-auto w-full max-w-5xl space-y-6">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-7">
                <h1 className="text-3xl font-semibold tracking-tight">{p.privacy_title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{p.privacy_last_updated}</p>
                <Link
                    href={`/${lang}/trust-center`}
                    className="mt-4 inline-flex min-h-10 items-center rounded-md border border-border/75 bg-background/70 px-3 text-sm font-medium hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {p.trust_center_title}
                </Link>
            </section>

            <section className="grid gap-4">
                {sections.map((section) => (
                    <article key={section.title} className="rounded-2xl border border-border/70 bg-background/55 p-5">
                        <h2 className="text-lg font-semibold">{section.title}</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.desc}</p>
                    </article>
                ))}
                <article className="rounded-2xl border border-border/70 bg-background/55 p-5">
                    <h2 className="text-lg font-semibold">{p.privacy_external_request_tools_title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.privacy_external_request_tools_desc}</p>
                    <div className="mt-4 grid gap-3">
                        {externalRequestTools.map((tool) => (
                            <div key={tool.key} className="rounded-xl border border-border/70 bg-card/45 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-medium">{toolTranslations[tool.key]?.title ?? tool.slug}</p>
                                    <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-300">
                                        {t.common.capability_external_request}
                                    </span>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                    {tool.privacy.externalRequest.disclosure}
                                </p>
                                <p className="mt-2 font-mono text-xs text-muted-foreground">
                                    {(tool.privacy.externalRequest.domains ?? []).join(", ")}
                                </p>
                            </div>
                        ))}
                    </div>
                </article>
                <LocalDataControls />
            </section>
        </div>
    )
}
