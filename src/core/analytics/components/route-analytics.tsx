"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    trackPageView,
    trackToolOpen,
    trackEvent,
    trackSeoLanding,
    trackCopyOutput,
    trackDownloadOutput,
    detectInteractionAnalyticsAction,
} from "@/core/analytics/analytics"
import { getRouteToolBySlug } from "@/generated/route-tool-lookup"
import { getRouteContext } from "@/core/routing/route-context"

const SEO_LANDING_SESSION_KEY = "byteflow:seo_landing_tracked"
const ORGANIC_REFERRER_HOST_KEYWORDS = ["google.", "bing.", "duckduckgo.", "yahoo.", "baidu.", "yandex."]

function isOrganicSearchReferrer() {
    if (typeof document === "undefined") return false
    if (!document.referrer) return false
    try {
        const host = new URL(document.referrer).hostname.toLowerCase()
        return ORGANIC_REFERRER_HOST_KEYWORDS.some((keyword) => host.includes(keyword))
    } catch {
        return false
    }
}

export function RouteAnalytics() {
    const pathname = usePathname()
    const lastTrackedPath = React.useRef<string>("")

    React.useEffect(() => {
        if (!pathname || lastTrackedPath.current === pathname) return
        lastTrackedPath.current = pathname

        trackPageView(pathname)

        const context = getRouteContext(pathname)
        if (!context.locale) return

        trackEvent("navigation", "locale_page_view", context.locale)
        try {
            const tracked = sessionStorage.getItem(SEO_LANDING_SESSION_KEY) === "1"
            if (!tracked && isOrganicSearchReferrer()) {
                trackSeoLanding({
                    locale: context.locale,
                    routeType: context.routeType,
                    pagePath: pathname,
                })
                sessionStorage.setItem(SEO_LANDING_SESSION_KEY, "1")
            }
        } catch {
            // Storage access can fail in strict privacy modes; skip tracking in that case.
        }

        if (!context.slug) return
        const tool = getRouteToolBySlug(context.slug)
        if (tool) {
            trackToolOpen(tool.key)
        }
    }, [pathname])

    React.useEffect(() => {
        const context = getRouteContext(pathname)
        if (!context.slug) return
        const tool = getRouteToolBySlug(context.slug)
        if (!tool) return

        const handleClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null
            if (!target) return
            if (target.closest("[data-analytics-action]")) return

            const clickable = target.closest("button,a,[role='button']") as HTMLElement | null
            if (!clickable) return

            const anchor = clickable.tagName === "A" ? (clickable as HTMLAnchorElement) : null
            const signal = (
                clickable.getAttribute("data-slot") ||
                clickable.getAttribute("aria-label") ||
                clickable.getAttribute("title") ||
                clickable.textContent ||
                ""
            )
            if (!signal) return

            const analyticsAction = detectInteractionAnalyticsAction(signal, {
                hasDownloadAttribute: Boolean(anchor?.download),
            })
            if (analyticsAction === "copy_output") {
                trackCopyOutput(tool.key, "ui_click_fallback")
                return
            }

            if (analyticsAction === "download_output") {
                trackDownloadOutput(tool.key, "ui_click_fallback")
            }
        }

        document.addEventListener("click", handleClick)
        return () => document.removeEventListener("click", handleClick)
    }, [pathname])

    return null
}
