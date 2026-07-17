"use client"

import * as React from "react"

export type VisualViewportRect = {
    top: number
    left: number
    width: number
    height: number
}

export function useVisualViewportRect(active = true) {
    const [rect, setRect] = React.useState<VisualViewportRect | null>(null)

    React.useEffect(() => {
        if (!active) return
        const viewport = window.visualViewport
        if (!viewport) return

        const syncRect = () => {
            setRect({
                top: viewport.offsetTop,
                left: viewport.offsetLeft,
                width: viewport.width,
                height: viewport.height,
            })
        }

        syncRect()
        viewport.addEventListener("resize", syncRect)
        viewport.addEventListener("scroll", syncRect)
        return () => {
            viewport.removeEventListener("resize", syncRect)
            viewport.removeEventListener("scroll", syncRect)
        }
    }, [active])

    return rect
}
