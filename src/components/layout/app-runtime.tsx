"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUp, Download } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"
import { VerificationModePanel } from "./verification-mode-panel"

const PWA_INSTALL_VISIT_COUNT_KEY = "byteflow:pwa-install:visit-count"
const PWA_INSTALL_DISMISSED_UNTIL_KEY = "byteflow:pwa-install:dismissed-until"
const PWA_INSTALL_SESSION_PROMPTED_KEY = "byteflow:pwa-install:session-prompted"
const PWA_INSTALL_INSTALLED_KEY = "byteflow:pwa-install:installed"
const PWA_INSTALL_MIN_VISITS = 3
const PWA_INSTALL_DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000
const SW_UPDATE_ENABLE_IN_DEV = process.env.NEXT_PUBLIC_ENABLE_SW_DEV === "1"

type PwaInstallCopy = {
    title: string
    message: string
    install: string
    guide: string
    later: string
}

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>
    userChoice: Promise<{
        outcome: "accepted" | "dismissed"
        platform: string
    }>
}

function isPwaInstalled(): boolean {
    if (typeof window === "undefined") return false
    const standaloneDisplayMode = window.matchMedia("(display-mode: standalone)").matches
    const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    let persistedInstalledFlag = false
    try {
        persistedInstalledFlag = window.localStorage.getItem(PWA_INSTALL_INSTALLED_KEY) === "1"
    } catch {
        persistedInstalledFlag = false
    }
    return standaloneDisplayMode || iosStandalone || persistedInstalledFlag
}

export function AppRuntime({ pathname }: { pathname: string }) {
    const { lang, t } = useLang()
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)
    const [showBackToTop, setShowBackToTop] = useState(false)

    const dismissInstallPrompt = useCallback(() => {
        setShowInstallPrompt(false)
        try {
            const dismissedUntil = Date.now() + PWA_INSTALL_DISMISS_COOLDOWN_MS
            window.localStorage.setItem(PWA_INSTALL_DISMISSED_UNTIL_KEY, String(dismissedUntil))
        } catch {
            // Ignore storage errors and keep runtime-only dismissal.
        }
    }, [])

    const handleInstallNow = useCallback(async () => {
        if (!deferredInstallPrompt) return
        setShowInstallPrompt(false)
        try {
            await deferredInstallPrompt.prompt()
            const choice = await deferredInstallPrompt.userChoice
            if (choice.outcome === "accepted") {
                window.localStorage.setItem(PWA_INSTALL_INSTALLED_KEY, "1")
            } else {
                const dismissedUntil = Date.now() + PWA_INSTALL_DISMISS_COOLDOWN_MS
                window.localStorage.setItem(PWA_INSTALL_DISMISSED_UNTIL_KEY, String(dismissedUntil))
            }
        } catch {
            const dismissedUntil = Date.now() + PWA_INSTALL_DISMISS_COOLDOWN_MS
            window.localStorage.setItem(PWA_INSTALL_DISMISSED_UNTIL_KEY, String(dismissedUntil))
        } finally {
            setDeferredInstallPrompt(null)
        }
    }, [deferredInstallPrompt])

    useEffect(() => {
        const handleBeforeInstallPrompt = (event: Event) => {
            if (isPwaInstalled()) return
            event.preventDefault()
            setDeferredInstallPrompt(event as BeforeInstallPromptEvent)
        }

        const handleAppInstalled = () => {
            setDeferredInstallPrompt(null)
            setShowInstallPrompt(false)
            try {
                window.localStorage.setItem(PWA_INSTALL_INSTALLED_KEY, "1")
            } catch {
                // Ignore storage errors and rely on display-mode detection.
            }
        }

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener)
        window.addEventListener("appinstalled", handleAppInstalled)
        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener)
            window.removeEventListener("appinstalled", handleAppInstalled)
        }
    }, [])

    useEffect(() => {
        if (!deferredInstallPrompt) return
        if (isPwaInstalled()) return

        let visitCount = 0
        try {
            const rawCount = window.localStorage.getItem(PWA_INSTALL_VISIT_COUNT_KEY)
            const parsedCount = rawCount ? Number.parseInt(rawCount, 10) : 0
            visitCount = Number.isFinite(parsedCount) ? parsedCount : 0
            visitCount += 1
            window.localStorage.setItem(PWA_INSTALL_VISIT_COUNT_KEY, String(visitCount))

            if (visitCount < PWA_INSTALL_MIN_VISITS) return

            const dismissedUntilRaw = window.localStorage.getItem(PWA_INSTALL_DISMISSED_UNTIL_KEY)
            const dismissedUntil = dismissedUntilRaw ? Number.parseInt(dismissedUntilRaw, 10) : 0
            if (Number.isFinite(dismissedUntil) && dismissedUntil > Date.now()) return

            if (window.sessionStorage.getItem(PWA_INSTALL_SESSION_PROMPTED_KEY) === "1") return
            window.sessionStorage.setItem(PWA_INSTALL_SESSION_PROMPTED_KEY, "1")
            setShowInstallPrompt(true)
        } catch {
            if (visitCount + 1 >= PWA_INSTALL_MIN_VISITS) {
                setShowInstallPrompt(true)
            }
        }
    }, [deferredInstallPrompt, pathname])

    useEffect(() => {
        if (process.env.NODE_ENV !== "production" && !SW_UPDATE_ENABLE_IN_DEV) return
        if (!("serviceWorker" in navigator)) return
        let isActive = true
        let updateInterval: NodeJS.Timeout | null = null
        let refreshing = false
        let updateToastShown = false
        let serviceWorkerRegistration: ServiceWorkerRegistration | null = null

        const handleControllerChange = () => {
            if (refreshing) return
            refreshing = true
            window.location.reload()
        }

        navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange)

        const showUpdateReadyToast = (registration: ServiceWorkerRegistration) => {
            if (!isActive || updateToastShown) return
            updateToastShown = true
            toast(t.common.update_available, {
                action: {
                    label: t.common.reload,
                    onClick: () => {
                        registration.waiting?.postMessage({ type: "SKIP_WAITING" })
                    },
                },
                duration: Number.POSITIVE_INFINITY,
            })
        }

        const watchInstallingWorker = (registration: ServiceWorkerRegistration) => {
            const installingWorker = registration.installing
            if (!installingWorker) return

            installingWorker.addEventListener("statechange", () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                    showUpdateReadyToast(registration)
                }
            })
        }

        const handleUpdateFound = () => {
            if (serviceWorkerRegistration) {
                watchInstallingWorker(serviceWorkerRegistration)
            }
        }

        navigator.serviceWorker.register("/sw.js").then((registration) => {
            if (!isActive) return
            serviceWorkerRegistration = registration
            if (registration.waiting && navigator.serviceWorker.controller) {
                showUpdateReadyToast(registration)
            }

            registration.addEventListener("updatefound", handleUpdateFound)

            const interval = process.env.NODE_ENV === "development" ? 60_000 : 600_000
            updateInterval = setInterval(() => {
                registration.update().catch(console.error)
            }, interval)
        }).catch(() => {
            // Service worker setup failure is non-blocking.
        })

        return () => {
            isActive = false
            navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange)
            serviceWorkerRegistration?.removeEventListener("updatefound", handleUpdateFound)
            if (updateInterval) {
                clearInterval(updateInterval)
            }
        }
    }, [t.common.reload, t.common.update_available])

    useEffect(() => {
        const onScroll = () => {
            setShowBackToTop(window.scrollY > 520)
        }

        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [pathname])

    const pwaInstallCopy: PwaInstallCopy = {
        title: requireTranslationValue(t.common.install_app_label, "common.install_app_label"),
        message: requireTranslationValue(t.common.install_prompt_message, "common.install_prompt_message"),
        install: requireTranslationValue(t.common.install, "common.install"),
        guide: requireTranslationValue(t.common.install_guide, "common.install_guide"),
        later: requireTranslationValue(t.common.later, "common.later"),
    }
    const backToTopLabel = requireTranslationValue(t.common.back_to_top, "common.back_to_top")

    const handleBackToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    return (
        <>
            {showInstallPrompt && deferredInstallPrompt ? (
                <div className="fixed bottom-6 left-4 z-40 max-w-sm rounded-xl border border-border/70 bg-background/95 p-4 shadow-lg backdrop-blur sm:left-6">
                    <p className="text-sm font-semibold text-foreground">{pwaInstallCopy.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{pwaInstallCopy.message}</p>
                    <div className="mt-3 flex items-center justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" asChild>
                            <Link href={`/${lang}/install-app`}>
                                {pwaInstallCopy.guide}
                            </Link>
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={dismissInstallPrompt}>
                            {pwaInstallCopy.later}
                        </Button>
                        <Button type="button" size="sm" onClick={() => void handleInstallNow()}>
                            <Download className="mr-2 h-4 w-4" />
                            {pwaInstallCopy.install}
                        </Button>
                    </div>
                </div>
            ) : null}
            {showBackToTop ? (
                <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="fixed bottom-24 right-4 z-40 h-10 w-10 rounded-full border border-border/70 shadow-md sm:right-6"
                    onClick={handleBackToTop}
                    aria-label={backToTopLabel}
                    title={backToTopLabel}
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
            ) : null}
            <VerificationModePanel pathname={pathname} />
        </>
    )
}
