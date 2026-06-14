"use client"

import dynamic from "next/dynamic"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const Toaster = dynamic(
    () => import("./sonner").then((mod) => mod.Toaster),
    { ssr: false },
)

export function DeferredToaster() {
    const isMounted = useDeferredMount({ delayMs: 2000, activateOnInteraction: true })

    return isMounted ? <Toaster /> : null
}
