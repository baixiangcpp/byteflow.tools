"use client"

import * as React from "react"

type ReturnFocusResolver = () => HTMLElement | null

function isConnectedFocusTarget(target: HTMLElement | null | undefined): target is HTMLElement {
    return Boolean(target?.isConnected)
        && target !== document.body
        && target !== document.documentElement
}

export function useDialogReturnFocus(takeExternalReturnFocus?: () => HTMLElement | null) {
    const returnFocusRef = React.useRef<HTMLElement | null>(null)
    const returnFocusFallbackRef = React.useRef<ReturnFocusResolver | null>(null)

    const captureReturnFocus = React.useCallback((focusTarget?: HTMLElement | null) => {
        const activeElement = focusTarget ?? document.activeElement
        returnFocusRef.current = activeElement instanceof HTMLElement
            && activeElement !== document.body
            && activeElement !== document.documentElement
            ? activeElement
            : null
        returnFocusFallbackRef.current = null
    }, [])

    const setReturnFocusFallback = React.useCallback((resolveFocusTarget: ReturnFocusResolver | null) => {
        returnFocusFallbackRef.current = resolveFocusTarget
    }, [])

    const restoreReturnFocus = React.useCallback((event: Event) => {
        const capturedFocusTarget = returnFocusRef.current
        const externalFocusTarget = takeExternalReturnFocus?.() ?? null
        const resolveFallbackFocusTarget = returnFocusFallbackRef.current
        returnFocusRef.current = null
        returnFocusFallbackRef.current = null

        const focusTarget = [capturedFocusTarget, externalFocusTarget].find(isConnectedFocusTarget)
            ?? resolveFallbackFocusTarget?.()
        if (!isConnectedFocusTarget(focusTarget)) return

        event.preventDefault()
        focusTarget.focus()
    }, [takeExternalReturnFocus])

    return { captureReturnFocus, restoreReturnFocus, setReturnFocusFallback }
}
