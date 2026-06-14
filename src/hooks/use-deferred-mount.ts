"use client"

import * as React from "react"

type UseDeferredMountOptions = {
    delayMs: number
    activateOnInteraction?: boolean
}

const POINTER_EVENT_OPTIONS = { once: true, passive: true } as const
const KEY_EVENT_OPTIONS = { once: true } as const

export function useDeferredMount({
    delayMs,
    activateOnInteraction = false,
}: UseDeferredMountOptions) {
    const [isMounted, setIsMounted] = React.useState(false)

    React.useEffect(() => {
        if (isMounted) return

        let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null

        const mount = () => {
            setIsMounted(true)
        }

        if (activateOnInteraction) {
            window.addEventListener("pointerdown", mount, POINTER_EVENT_OPTIONS)
            window.addEventListener("keydown", mount, KEY_EVENT_OPTIONS)
            window.addEventListener("touchstart", mount, POINTER_EVENT_OPTIONS)
        }

        timeoutId = globalThis.setTimeout(mount, delayMs)

        return () => {
            if (activateOnInteraction) {
                window.removeEventListener("pointerdown", mount)
                window.removeEventListener("keydown", mount)
                window.removeEventListener("touchstart", mount)
            }

            if (timeoutId !== null) {
                globalThis.clearTimeout(timeoutId)
            }
        }
    }, [activateOnInteraction, delayMs, isMounted])

    return isMounted
}
