"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { useVisualViewportRect } from "@/hooks/use-visual-viewport-rect"
import type { ToolActionResult } from "./tool-action-bar"

export type InlineToolActionFeedbackState = {
    id: number
    result: ToolActionResult
} | null

export function useInlineToolActionFeedback() {
    const sequenceRef = React.useRef(0)
    const mountedRef = React.useRef(true)
    const dismissTimerRef = React.useRef<ReturnType<typeof globalThis.setTimeout> | null>(null)
    const [feedback, setFeedback] = React.useState<InlineToolActionFeedbackState>(null)

    const clearDismissTimer = React.useCallback(() => {
        if (dismissTimerRef.current !== null) {
            globalThis.clearTimeout(dismissTimerRef.current)
            dismissTimerRef.current = null
        }
    }, [])

    React.useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            clearDismissTimer()
        }
    }, [clearDismissTimer])

    const run = React.useCallback(async (action: () => Promise<ToolActionResult>) => {
        const result = await action()
        if (!mountedRef.current) return result
        clearDismissTimer()
        if (result.announce === true) {
            sequenceRef.current += 1
            const id = sequenceRef.current
            setFeedback({ id, result })
            dismissTimerRef.current = globalThis.setTimeout(() => {
                setFeedback((current) => current?.id === id ? null : current)
                dismissTimerRef.current = null
            }, result.status === "failed" ? 8000 : 5000)
        } else {
            setFeedback(null)
        }
        return result
    }, [clearDismissTimer])

    return { feedback, run }
}

export function InlineToolActionFeedback({ feedback }: { feedback: InlineToolActionFeedbackState }) {
    const visualViewportRect = useVisualViewportRect()

    if (!feedback?.result.message || typeof document === "undefined") return null

    const { message, description, status } = feedback.result
    const text = description
        ? `${message}${/[.!?]$/.test(message) ? " " : ". "}${description}`
        : message

    return createPortal(
        <div
            data-inline-tool-action-feedback-viewport
            className={visualViewportRect
                ? "pointer-events-none fixed z-[100] flex items-end justify-end p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
                : "pointer-events-none fixed inset-0 z-[100] flex items-end justify-end p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"}
            style={visualViewportRect || undefined}
        >
            <p
                key={feedback.id}
                role={status === "failed" ? "alert" : "status"}
                aria-atomic="true"
                data-inline-tool-action-feedback
                className={status === "failed"
                    ? "max-w-full break-words [overflow-wrap:anywhere] rounded-md border border-destructive/40 bg-background px-3 py-2 text-sm text-destructive shadow-lg sm:max-w-sm"
                    : "max-w-full break-words [overflow-wrap:anywhere] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-lg sm:max-w-sm"}
            >
                {text}
            </p>
        </div>,
        document.body,
    )
}
