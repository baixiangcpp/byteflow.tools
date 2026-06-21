"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { DeferredAppRuntime } from "./deferred-app-runtime"
import { DeferredCommandPalette } from "./deferred-command-palette"
import { DeferredNewsletterCTA } from "./deferred-newsletter-cta"
import { DeferredAnalytics } from "@/core/analytics/components/deferred-analytics"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { useLang } from "@/core/i18n/lang-provider"

const RoutePageChrome = dynamic(
    () => import("./route-page-chrome").then((mod) => mod.RoutePageChrome),
    { ssr: true },
)

export function AppLayout({
    children,
    header,
    footer,
}: {
    children: React.ReactNode
    header?: React.ReactNode
    footer?: React.ReactNode
}) {
    const pathname = usePathname()
    const { t } = useLang()
    const isHomePage = pathname === "/" || /^\/[a-zA-Z-]{2,5}$/.test(pathname)
    const skipToContentLabel = requireTranslationValue(t.common.skip_to_main_content, "common.skip_to_main_content")
    const mainClassName = isHomePage
        ? "relative flex min-h-0 flex-1 flex-col"
        : "relative flex min-h-0 flex-1 flex-col bg-background/55"
    const contentClassName = isHomePage
        ? "flex-1 min-h-0"
        : "flex-1 min-h-0 mx-auto w-full max-w-screen-2xl px-4 pb-10 pt-4 md:px-8 md:pt-8 lg:px-10"

    return (
        <div className="flex min-h-screen flex-col bg-background pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)]">
            <a
                href="#main-content"
                className="sr-only z-[60] mx-auto mt-2 w-fit rounded-md bg-background px-3 py-2 text-sm text-foreground shadow-sm ring-1 ring-border focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
                data-skip-link="main-content"
                onClick={(event) => {
                    const main = document.getElementById("main-content")
                    if (!main) return
                    event.preventDefault()
                    main.focus({ preventScroll: true })
                    main.scrollIntoView({ block: "start" })
                    window.history.pushState(null, "", "#main-content")
                }}
            >
                {skipToContentLabel}
            </a>
            <DeferredAnalytics />
            <DeferredAppRuntime pathname={pathname} />
            {header}
            <DeferredCommandPalette />
            <main id="main-content" tabIndex={-1} className={mainClassName}>
                <div className={contentClassName}>
                    {isHomePage ? children : (
                        <RoutePageChrome pathname={pathname}>
                            {children}
                        </RoutePageChrome>
                    )}
                </div>
                <DeferredNewsletterCTA />
            </main>
            {footer}
        </div>
    )
}
