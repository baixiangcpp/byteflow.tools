"use client"

import dynamic from "next/dynamic"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const AppRuntime = dynamic(
    () => import("./app-runtime").then((mod) => mod.AppRuntime),
    { ssr: false },
)

export function DeferredAppRuntime({ pathname }: { pathname: string }) {
    const isMounted = useDeferredMount({ delayMs: 1800, activateOnInteraction: true })

    if (!isMounted) return null

    return <AppRuntime pathname={pathname} />
}
