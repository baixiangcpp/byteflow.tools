"use client"

import * as React from "react"

const TEMPLATE_BASE_CLASS =
    "mx-auto mt-10 w-full max-w-7xl rounded-2xl border border-border/70 bg-card/55 p-5 backdrop-blur-sm sm:p-6"

function readClassName(element: Element): string {
    const className = (element as HTMLElement).className
    return typeof className === "string" ? className : ""
}

function isWidthConstrainedContainer(element: Element): boolean {
    const className = readClassName(element)
    return className.includes("max-w-") && className.includes("mx-auto")
}

function measureElementWidth(element: HTMLElement): number {
    const rectWidth = element.getBoundingClientRect().width
    if (rectWidth > 0) return rectWidth
    if (element.clientWidth > 0) return element.clientWidth

    const inlineWidth = Number.parseFloat(element.style.width || "")
    if (Number.isFinite(inlineWidth) && inlineWidth > 0) return inlineWidth

    return 0
}

function findToolContainerByHeading(section: HTMLElement): HTMLElement | null {
    const main = section.closest("main")
    if (!main) return null

    const headings = Array.from(main.querySelectorAll("h1"))
    for (let index = headings.length - 1; index >= 0; index -= 1) {
        const heading = headings[index]
        const position = heading.compareDocumentPosition(section)
        const isBeforeSection = Boolean(position & Node.DOCUMENT_POSITION_FOLLOWING)
        if (!isBeforeSection) continue

        let current: HTMLElement | null = heading.parentElement
        while (current && current !== main) {
            if (isWidthConstrainedContainer(current)) return current
            current = current.parentElement
        }
    }

    return null
}

function findPreviousToolContainer(section: HTMLElement): HTMLElement | null {
    let sibling = section.previousElementSibling as HTMLElement | null
    while (sibling && sibling.tagName === "SCRIPT") {
        sibling = sibling.previousElementSibling as HTMLElement | null
    }
    if (!sibling) return null

    const candidates: HTMLElement[] = [sibling, ...Array.from(sibling.querySelectorAll<HTMLElement>("*"))]

    let bestMatch: HTMLElement | null = null
    let bestWidth = 0
    for (const candidate of candidates) {
        if (!isWidthConstrainedContainer(candidate)) continue

        const width = measureElementWidth(candidate)
        if (width > bestWidth) {
            bestMatch = candidate
            bestWidth = width
        }
    }

    return bestMatch
}

export function ToolContentTemplateSurface({
    source,
    children,
}: {
    source: "client" | "server"
    children: React.ReactNode
}) {
    const sectionRef = React.useRef<HTMLElement | null>(null)
    const [syncedMaxWidthPx, setSyncedMaxWidthPx] = React.useState<number | null>(null)

    React.useEffect(() => {
        const section = sectionRef.current
        if (!section) return

        let widthObserver: ResizeObserver | null = null
        let observedContainer: HTMLElement | null = null
        let frameId: number | null = null

        const syncWidth = () => {
            const container = findToolContainerByHeading(section) || findPreviousToolContainer(section)
            if (!container) {
                setSyncedMaxWidthPx(null)
                observedContainer = null
                if (widthObserver) {
                    widthObserver.disconnect()
                    widthObserver = null
                }
                return
            }

            const nextWidth = Math.round(measureElementWidth(container))
            if (nextWidth > 0) {
                setSyncedMaxWidthPx((previous) => (previous === nextWidth ? previous : nextWidth))
            }

            if (observedContainer === container) return

            observedContainer = container
            if (widthObserver) {
                widthObserver.disconnect()
                widthObserver = null
            }
            if (typeof ResizeObserver !== "undefined" && typeof window !== "undefined") {
                widthObserver = new ResizeObserver(() => {
                    if (typeof window.requestAnimationFrame === "function") {
                        if (frameId != null) window.cancelAnimationFrame(frameId)
                        frameId = window.requestAnimationFrame(syncWidth)
                        return
                    }
                    syncWidth()
                })
                widthObserver.observe(container)
            }
        }

        syncWidth()
        window.addEventListener("resize", syncWidth)

        return () => {
            window.removeEventListener("resize", syncWidth)
            if (frameId != null) window.cancelAnimationFrame(frameId)
            if (widthObserver) widthObserver.disconnect()
        }
    }, [])

    return (
        <section
            ref={sectionRef}
            data-tool-content-template="full"
            data-tool-content-template-source={source}
            data-tool-content-template-width-sync={syncedMaxWidthPx ? "synced" : "fallback"}
            className={TEMPLATE_BASE_CLASS}
            style={syncedMaxWidthPx ? { maxWidth: `${syncedMaxWidthPx}px` } : undefined}
        >
            {children}
        </section>
    )
}
