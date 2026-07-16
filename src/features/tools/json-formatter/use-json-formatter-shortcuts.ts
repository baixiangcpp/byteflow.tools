"use client"

import * as React from "react"
import type { JsonFormatMode } from "./format-json-task"

type JsonFormatterShortcutOptions = {
    canCopy: boolean
    onCopy: () => void | Promise<unknown>
    onFormatAction: (actionId: JsonFormatMode) => void
    onOpenTreeSearch: () => void
    treeViewActive: boolean
}

export function useJsonFormatterShortcuts({
    canCopy,
    onCopy,
    onFormatAction,
    onOpenTreeSearch,
    treeViewActive,
}: JsonFormatterShortcutOptions) {
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.metaKey && !event.ctrlKey) return

            if (event.key === "Enter") {
                event.preventDefault()
                event.stopPropagation()
                onFormatAction(event.shiftKey ? "minify" : "format")
                return
            }

            if ((event.key === "c" || event.key === "C") && event.shiftKey && canCopy) {
                event.preventDefault()
                event.stopPropagation()
                void onCopy()
                return
            }

            if ((event.key === "f" || event.key === "F") && treeViewActive) {
                event.preventDefault()
                event.stopPropagation()
                onOpenTreeSearch()
            }
        }

        window.addEventListener("keydown", handleKeyDown, true)
        return () => window.removeEventListener("keydown", handleKeyDown, true)
    }, [canCopy, onCopy, onFormatAction, onOpenTreeSearch, treeViewActive])
}
