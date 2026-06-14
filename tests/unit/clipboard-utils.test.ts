import { afterEach, describe, expect, it, vi } from "vitest"
import { safeClipboardWrite } from "@/core/clipboard/clipboard"

const originalClipboard = navigator.clipboard
const originalExecCommand = document.execCommand

afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: originalClipboard,
    })
    Object.defineProperty(document, "execCommand", {
        configurable: true,
        value: originalExecCommand,
    })
    document.body.innerHTML = ""
    vi.clearAllMocks()
})

describe("safeClipboardWrite", () => {
    it("uses the native clipboard API when available", async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        })

        const result = await safeClipboardWrite("hello")

        expect(writeText).toHaveBeenCalledWith("hello")
        expect(result).toEqual({
            ok: true,
            method: "clipboard-api",
        })
    })

    it("falls back to execCommand when clipboard API is unavailable", async () => {
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: undefined,
        })
        const execCommand = vi.fn().mockReturnValue(true)
        Object.defineProperty(document, "execCommand", {
            configurable: true,
            value: execCommand,
        })

        const result = await safeClipboardWrite("fallback")

        expect(execCommand).toHaveBeenCalledWith("copy")
        expect(result).toEqual({
            ok: true,
            method: "exec-command",
        })
    })

    it("falls back to execCommand when clipboard API throws", async () => {
        const writeText = vi.fn().mockRejectedValue(new DOMException("Not allowed", "NotAllowedError"))
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        })
        const execCommand = vi.fn().mockReturnValue(true)
        Object.defineProperty(document, "execCommand", {
            configurable: true,
            value: execCommand,
        })

        const result = await safeClipboardWrite("retry")

        expect(writeText).toHaveBeenCalledWith("retry")
        expect(execCommand).toHaveBeenCalledWith("copy")
        expect(result).toEqual({
            ok: true,
            method: "exec-command",
        })
    })

    it("returns failure when all clipboard strategies fail", async () => {
        const writeText = vi.fn().mockRejectedValue(new DOMException("Not allowed", "NotAllowedError"))
        Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: { writeText },
        })
        const execCommand = vi.fn().mockReturnValue(false)
        Object.defineProperty(document, "execCommand", {
            configurable: true,
            value: execCommand,
        })

        const result = await safeClipboardWrite("nope")

        expect(result.ok).toBe(false)
        expect(result.method).toBe("none")
        expect(result.error).toBeInstanceOf(Error)
    })
})
