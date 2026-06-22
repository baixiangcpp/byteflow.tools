"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    trackToolOpen,
    trackCopyOutput,
    trackDownloadOutput,
    detectInteractionAnalyticsAction,
} from "@/core/analytics/analytics"
import { getRouteToolBySlug } from "@/generated/route-tool-lookup"
import { getRouteContext } from "@/core/routing/route-context"

export function RouteAnalytics() {
    const pathname = usePathname()
    const lastTrackedPath = React.useRef<string>("")

    React.useEffect(() => {
        if (!pathname || lastTrackedPath.current === pathname) return
        lastTrackedPath.current = pathname

        const context = getRouteContext(pathname)
        if (!context.locale) return

        if (!context.slug) return
        const tool = getRouteToolBySlug(context.slug)
        if (tool) {
            trackToolOpen(tool.key, context.locale, "tool_page")
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
                trackCopyOutput(tool.key, "ui_click_fallback", context.locale)
                return
            }

            if (analyticsAction === "download_output") {
                trackDownloadOutput(tool.key, "ui_click_fallback", { language: context.locale, sourcePage: "tool_page" })
            }
        }

        document.addEventListener("click", handleClick)
        return () => document.removeEventListener("click", handleClick)
    }, [pathname])

    return null
}
