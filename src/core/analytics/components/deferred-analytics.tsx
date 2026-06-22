"use client"

import dynamic from "next/dynamic"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const RouteAnalytics = dynamic(
    () => import("./route-analytics").then((mod) => mod.RouteAnalytics),
    { ssr: false },
)

export function DeferredAnalytics() {
    const isMounted = useDeferredMount({ delayMs: 1500, activateOnInteraction: true })

    if (!isMounted) return null

    return <RouteAnalytics />
}
