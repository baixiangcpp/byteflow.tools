"use client"

import dynamic from "next/dynamic"
import { useCallback } from "react"
import {
    consumePwaInstallPrompt,
    usePwaInstallPrompt,
} from "@/core/pwa/install-prompt-store"
import { useDeferredMount } from "@/hooks/use-deferred-mount"

const AppRuntime = dynamic(
    () => import("./app-runtime").then((mod) => mod.AppRuntime),
    { ssr: false },
)

export function DeferredAppRuntime({ pathname }: { pathname: string }) {
    const capturedInstallPrompt = usePwaInstallPrompt()
    const clearCapturedInstallPrompt = useCallback(() => {
        consumePwaInstallPrompt(capturedInstallPrompt)
    }, [capturedInstallPrompt])

    const isMounted = useDeferredMount({ delayMs: 1800, activateOnInteraction: true })

    if (!isMounted) return null

    return (
        <AppRuntime
            pathname={pathname}
            capturedInstallPrompt={capturedInstallPrompt}
            onInstallPromptConsumed={clearCapturedInstallPrompt}
        />
    )
}
