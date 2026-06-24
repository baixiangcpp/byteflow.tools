"use client"

import Link from "next/link"
import { Check, Sparkles, ShieldCheck, LockKeyhole, ArrowUpRight } from "lucide-react"
import { useLang } from "@/core/i18n/lang-provider"

export default function PricingPage() {
    const { t, lang } = useLang()
    const p = t.pages

    const principles = [
        {
            icon: Sparkles,
            title: p.pricing_free_plan_title,
            price: p.pricing_free_plan_price,
            desc: p.pricing_free_plan_desc,
            featured: true,
        },
        {
            icon: ShieldCheck,
            title: p.pricing_pro_plan_title,
            price: p.pricing_pro_plan_price,
            desc: p.pricing_pro_plan_desc,
            featured: false,
        },
        {
            icon: LockKeyhole,
            title: p.pricing_team_plan_title,
            price: p.pricing_team_plan_price,
            desc: p.pricing_team_plan_desc,
            featured: false,
        },
    ]

    const featureKeys = [
        p.pricing_feature_local_first,
        p.pricing_feature_offline,
        p.pricing_feature_open_source,
        p.pricing_feature_fast_updates,
    ]

    return (
        <div className="mx-auto w-full max-w-6xl space-y-8">
            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm sm:p-8">
                <p className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {p.pricing_badge}
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">{p.pricing_title}</h1>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">{p.pricing_intro}</p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {principles.map((plan) => (
                    <article
                        key={plan.title}
                        className={`rounded-2xl border bg-background/55 p-5 transition-[border-color,box-shadow] duration-200 ${
                            plan.featured
                                ? "border-primary/40 ring-1 ring-primary/25"
                                : "border-border/70 hover:border-primary/30"
                        }`}
                    >
                        <plan.icon className="h-5 w-5 text-primary" />
                        <h2 className="mt-3 text-lg font-semibold">{plan.title}</h2>
                        <p className="mt-1 text-sm text-primary">{plan.price}</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{plan.desc}</p>
                    </article>
                ))}
            </section>

            <section className="rounded-2xl border border-border/70 bg-card/55 p-6 backdrop-blur-sm">
                <h2 className="text-lg font-semibold">{p.pricing_includes_title}</h2>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {featureKeys.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Check className="mt-0.5 h-4 w-4 text-primary" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                    href={`/${lang}/all-tools`}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/35 bg-primary/12 px-4 py-2.5 text-sm text-primary transition-colors hover:bg-primary/20"
                >
                    {p.pricing_cta_primary}
                </Link>
                <a
                    href="https://github.com/baixiangcpp/byteflow.tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-border/75 bg-background/55 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    {p.pricing_cta_secondary}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
                <Link
                    href={`/${lang}/self-hosting`}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/75 bg-background/55 px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    Self-hosting guide
                </Link>
            </section>
        </div>
    )
}
