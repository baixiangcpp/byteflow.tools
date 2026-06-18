import { describe, expect, it, vi } from "vitest"
import { openExternalUrl, parseSafeExternalUrl, sanitizeDownloadFilename } from "@/core/security/external-url"

describe("external-url security helpers", () => {
    it("accepts https urls and can add https to host-like input", () => {
        expect(parseSafeExternalUrl("https://example.com/path").ok).toBe(true)

        const parsed = parseSafeExternalUrl("example.com/path", { addHttpsWhenMissing: true })
        expect(parsed.ok ? parsed.url.toString() : "").toBe("https://example.com/path")
    })

    it("rejects dangerous protocols and mixed-content by default", () => {
        expect(parseSafeExternalUrl("javascript:alert(1)")).toEqual({ ok: false, reason: "unsupported_protocol" })
        expect(parseSafeExternalUrl("data:text/html,<script>alert(1)</script>")).toEqual({ ok: false, reason: "unsupported_protocol" })
        expect(parseSafeExternalUrl("ftp://example.com/file.txt")).toEqual({ ok: false, reason: "unsupported_protocol" })
        expect(parseSafeExternalUrl("http://example.com/file.txt")).toEqual({ ok: false, reason: "insecure_protocol" })
    })

    it("enforces host and extension allowlists with hostname boundaries", () => {
        expect(parseSafeExternalUrl("https://cdn.example.com/photo.jpg", {
            allowedHostnameSuffixes: ["example.com"],
            allowedPathExtensions: [".jpg", ".png"],
        }).ok).toBe(true)
        expect(parseSafeExternalUrl("https://badexample.com/photo.jpg", {
            allowedHostnameSuffixes: ["example.com"],
            allowedPathExtensions: [".jpg", ".png"],
        })).toEqual({ ok: false, reason: "blocked_hostname" })
        expect(parseSafeExternalUrl("https://cdn.example.com/photo.svg", {
            allowedHostnameSuffixes: ["example.com"],
            allowedPathExtensions: [".jpg", ".png"],
        })).toEqual({ ok: false, reason: "unsupported_extension" })
    })

    it("sanitizes download filenames", () => {
        expect(sanitizeDownloadFilename("../my photo!.png", "file.png")).toBe("my-photo.png")
        expect(sanitizeDownloadFilename("???", "file.png")).toBe("file.png")
    })

    it("opens external urls with noopener and noreferrer", () => {
        const opened = { opener: "before" }
        const open = vi.spyOn(window, "open").mockReturnValue(opened as unknown as Window)

        expect(openExternalUrl("https://example.com/path")).toBe(true)
        expect(open).toHaveBeenCalledWith("https://example.com/path", "_blank", "noopener,noreferrer")
        expect(opened.opener).toBeNull()

        expect(openExternalUrl("javascript:alert(1)")).toBe(false)
        expect(open).toHaveBeenCalledTimes(1)
    })
})
