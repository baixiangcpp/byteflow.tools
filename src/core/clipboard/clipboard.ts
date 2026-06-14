export type ClipboardWriteResult = {
    ok: boolean
    method: "clipboard-api" | "exec-command" | "none"
    error?: Error
}

function normalizeError(value: unknown): Error {
    if (value instanceof Error) return value
    if (typeof value === "string") return new Error(value)
    return new Error("Unknown clipboard error")
}

function legacyExecCommandCopy(text: string): ClipboardWriteResult {
    if (typeof document === "undefined" || typeof document.execCommand !== "function") {
        return {
            ok: false,
            method: "none",
            error: new Error("document.execCommand is unavailable."),
        }
    }

    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.setAttribute("readonly", "")
    textarea.style.position = "fixed"
    textarea.style.top = "0"
    textarea.style.left = "0"
    textarea.style.opacity = "0"
    textarea.style.pointerEvents = "none"
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
        const copied = document.execCommand("copy")
        if (!copied) {
            return {
                ok: false,
                method: "none",
                error: new Error("document.execCommand('copy') returned false."),
            }
        }
        return { ok: true, method: "exec-command" }
    } catch (error) {
        return {
            ok: false,
            method: "none",
            error: normalizeError(error),
        }
    } finally {
        textarea.remove()
    }
}

export async function safeClipboardWrite(text: string): Promise<ClipboardWriteResult> {
    if (typeof window === "undefined") {
        return {
            ok: false,
            method: "none",
            error: new Error("Clipboard API is unavailable on the server."),
        }
    }

    const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined
    if (clipboard && typeof clipboard.writeText === "function") {
        try {
            await clipboard.writeText(text)
            return { ok: true, method: "clipboard-api" }
        } catch (error) {
            const fallback = legacyExecCommandCopy(text)
            if (fallback.ok) return fallback
            return {
                ok: false,
                method: "none",
                error: fallback.error ?? normalizeError(error),
            }
        }
    }

    return legacyExecCommandCopy(text)
}
