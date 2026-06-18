"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Download, Globe, Shield, Smartphone, WifiOff, Zap } from "lucide-react"
import { trackEvent } from "@/core/analytics/analytics"
import { Button } from "@/components/ui/button"
import { getAllToolsHref } from "@/core/routing/all-tools-route"
import type { Locale } from "@/core/i18n/i18n"
import { JsonLdScript } from "@/core/seo/components/json-ld-script"
import type { GuidePlatform, InstallPageCopy } from "@/core/utils/install-app-copy"

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

function isStandaloneInstalled() {
    if (typeof window === "undefined") return false
    const standaloneDisplayMode = window.matchMedia("(display-mode: standalone)").matches
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    return standaloneDisplayMode || iosStandalone
}

const BENEFIT_ICON_BY_KEY = {
    instant_launch: Zap,
    works_offline: WifiOff,
    local_first: Shield,
} as const

type InstallAppClientProps = {
    locale: Locale
    copy: InstallPageCopy
    allToolsLabel: string
}

export function InstallAppClient({ locale, copy, allToolsLabel }: InstallAppClientProps) {
    const [platform, setPlatform] = React.useState<GuidePlatform>("chrome_desktop")
    const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
    const [installed, setInstalled] = React.useState(false)
    const [manualHintVisible, setManualHintVisible] = React.useState(false)
    const guideRef = React.useRef<HTMLDivElement | null>(null)
    const installSuccessTrackedRef = React.useRef(false)

    const trackInstallSuccess = React.useCallback((platformName?: string) => {
        if (installSuccessTrackedRef.current) return
        installSuccessTrackedRef.current = true
        trackEvent("pwa", "pwa_install_success", "cta_page", {
            locale,
            ...(platformName ? { platform: platformName } : {}),
        })
    }, [locale])

    React.useEffect(() => {
        setInstalled(isStandaloneInstalled())
        trackEvent("pwa", "pwa_cta_page_view", locale, { locale })

        const onBeforeInstallPrompt = (event: Event) => {
            event.preventDefault()
            setDeferredPrompt(event as BeforeInstallPromptEvent)
        }
        const onInstalled = () => {
            setInstalled(true)
            setDeferredPrompt(null)
            trackInstallSuccess()
        }

        window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener)
        window.addEventListener("appinstalled", onInstalled)
        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt as EventListener)
            window.removeEventListener("appinstalled", onInstalled)
        }
    }, [locale, trackInstallSuccess])

    const activeGuide = copy.guides[platform]
    const faqJsonLd = React.useMemo(
        () => ({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: copy.faq.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
        }),
        [copy.faq],
    )

    const scrollToGuide = (source: "install_button" | "already_manual") => {
        guideRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        setManualHintVisible(true)
        trackEvent("pwa", "pwa_manual_guide_view", source, { locale, platform })
    }

    const handleInstall = async () => {
        if (installed) return
        trackEvent("pwa", "pwa_install_click", "cta_page", {
            locale,
            has_prompt: Boolean(deferredPrompt),
        })

        if (!deferredPrompt) {
            scrollToGuide("install_button")
            return
        }

        try {
            await deferredPrompt.prompt()
            const choice = await deferredPrompt.userChoice
            if (choice.outcome === "accepted") {
                setInstalled(true)
                trackInstallSuccess(choice.platform)
            } else {
                trackEvent("pwa", "pwa_install_dismissed", "cta_page", { locale, platform: choice.platform })
                scrollToGuide("already_manual")
            }
        } catch {
            scrollToGuide("already_manual")
        } finally {
            setDeferredPrompt(null)
        }
    }

    const primaryLabel = installed ? copy.alreadyInstalled : deferredPrompt ? copy.installNow : copy.seeGuide

    return (
        <div className="mx-auto w-full max-w-5xl space-y-8">
            <JsonLdScript jsonLd={faqJsonLd} />

            <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,hsl(189_94%_46%/0.14),transparent_55%,hsl(37_95%_55%/0.12))]" />
                <div className="relative space-y-4">
                    <p className="inline-flex min-h-8 items-center rounded-full border border-primary/35 bg-primary/12 px-3 text-xs font-semibold text-primary">
                        {copy.badge}
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{copy.subtitle}</p>
                    <div className="flex flex-wrap gap-3 pt-1">
                        <Button onClick={() => void handleInstall()} disabled={installed}>
                            <Download className="mr-2 h-4 w-4" />
                            {primaryLabel}
                        </Button>
                        <Button asChild variant="outline">
                            <Link href={`/${locale}`}>{copy.openApp}</Link>
                        </Button>
                    </div>
                    {manualHintVisible ? (
                        <p className="text-xs text-muted-foreground">{copy.manualHint}</p>
                    ) : null}
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">{copy.sectionBenefits}</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    {copy.benefits.map((item) => {
                        const Icon = BENEFIT_ICON_BY_KEY[item.key]
                        return (
                            <article key={item.key} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/12 text-primary">
                                    <Icon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                            </article>
                        )
                    })}
                </div>
            </section>

            <section ref={guideRef} className="space-y-4 rounded-2xl border border-border/70 bg-card/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{copy.sectionGuide}</h2>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(copy.guides) as GuidePlatform[]).map((key) => (
                        <Button
                            key={key}
                            type="button"
                            size="sm"
                            variant={platform === key ? "default" : "outline"}
                            onClick={() => {
                                setPlatform(key)
                                trackEvent("pwa", "pwa_manual_guide_view", "tab_switch", { locale, platform: key })
                            }}
                        >
                            {copy.guides[key].label}
                        </Button>
                    ))}
                </div>
                <div className="grid gap-4 rounded-xl border border-border/65 bg-background/55 p-4 sm:grid-cols-[1.1fr_0.9fr]">
                    <div>
                        <h3 className="text-base font-semibold">{activeGuide.title}</h3>
                        <ol className="mt-2 ml-5 list-decimal space-y-2 text-sm text-muted-foreground">
                            {activeGuide.steps.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>
                    </div>
                    <div className="rounded-lg border border-border/65 bg-card/40 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {copy.guidePreviewLabel}
                        </p>
                        <Image
                            src={activeGuide.screenshot}
                            alt={`${activeGuide.label} ${copy.guidePreviewLabel}`}
                            width={1280}
                            height={720}
                            className="w-full rounded-md border border-border/65"
                            loading="lazy"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-border/70 bg-background/55 p-5 sm:p-6">
                <h2 className="text-xl font-semibold tracking-tight">{copy.sectionFaq}</h2>
                <div className="space-y-3">
                    {copy.faq.map((item) => (
                        <details key={item.question} className="rounded-lg border border-border/70 bg-card/45 p-3">
                            <summary className="cursor-pointer text-sm font-medium">{item.question}</summary>
                            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
                        </details>
                    ))}
                </div>
            </section>

            <section className="rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
                <h2 className="text-lg font-semibold">{copy.sectionBottom}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{copy.bottomTrust}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => void handleInstall()} disabled={installed}>
                        <Smartphone className="mr-2 h-4 w-4" />
                        {primaryLabel}
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={getAllToolsHref(locale)}>
                            <Globe className="mr-2 h-4 w-4" />
                            {allToolsLabel}
                        </Link>
                    </Button>
                </div>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {copy.bottomTrust}
                </p>
            </section>
        </div>
    )
}
