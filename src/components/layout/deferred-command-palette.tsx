"use client"

import * as React from "react"
import dynamic from "next/dynamic"

const CommandPalette = dynamic(
    () => import("./command-palette").then((mod) => mod.CommandPalette),
    { ssr: false },
)
const COMMAND_PALETTE_TRIGGER_SELECTOR = "[data-command-palette-trigger]"

function isEditableShortcutTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false
    if (target.isContentEditable) return true
    if (target.closest("[contenteditable=''], [contenteditable='true']")) return true

    const tagName = target.tagName.toLowerCase()
    if (["input", "textarea", "select"].includes(tagName)) return true

    if (target.getAttribute("role") === "textbox") return true

    return Boolean(target.closest("input, textarea, select, [role='textbox'], .monaco-editor, .monaco-diff-editor"))
}

export function DeferredCommandPalette() {
    const [isMounted, setIsMounted] = React.useState(false)
    const [open, setOpen] = React.useState(false)

    React.useEffect(() => {
        const activatePalette = () => {
            setIsMounted(true)
            setOpen(true)
        }

        const down = (e: KeyboardEvent) => {
            if (e.defaultPrevented || isEditableShortcutTarget(e.target)) return
            if (e.key !== "k" || (!e.metaKey && !e.ctrlKey)) return

            e.preventDefault()
            activatePalette()
        }

        const click = (e: MouseEvent) => {
            if (!(e.target instanceof HTMLElement)) return
            const trigger = e.target.closest(COMMAND_PALETTE_TRIGGER_SELECTOR)
            if (!trigger) return

            e.preventDefault()
            activatePalette()
        }

        document.addEventListener("keydown", down)
        document.addEventListener("click", click)
        return () => {
            document.removeEventListener("keydown", down)
            document.removeEventListener("click", click)
        }
    }, [])

    if (!isMounted) return null

    return <CommandPalette open={open} onOpenChange={setOpen} enableShortcut={false} />
}
