"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import { useReportWebVitals } from "next/web-vitals"
import { trackEvent } from "@/core/analytics/analytics"
import { getRouteContext } from "@/core/routing/route-context"

const TRACKED_CWV_METRICS = new Set(["LCP", "INP", "CLS"])

export function WebVitalsAnalytics() {
    const pathname = usePathname()
    const context = useMemo(() => getRouteContext(pathname || "/"), [pathname])

    useReportWebVitals((metric) => {
        if (!TRACKED_CWV_METRICS.has(metric.name)) return

        trackEvent("web_vitals", "cwv_metric", `${metric.name}:${context.routeType}`, {
            metric_name: metric.name,
            metric_value: Number(metric.value.toFixed(2)),
            metric_delta: Number(metric.delta.toFixed(2)),
            metric_rating: metric.rating,
            metric_id: metric.id,
            route_type: context.routeType,
            locale: context.locale || "global",
        })
    })

    return null
}
