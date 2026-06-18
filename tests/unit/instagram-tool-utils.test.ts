import { describe, expect, it } from "vitest"
import {
    canDownloadAuthorizedInstagramMedia,
    getInstagramFilterCss,
    getInstagramFilterPreset,
    getInstagramMediaFilename,
    parseInstagramMediaInput,
} from "@/core/utils/instagram-tool-utils"

describe("instagram-tool-utils", () => {
    it("returns fallback preset when unknown id is provided", () => {
        const preset = getInstagramFilterPreset("missing-preset")
        expect(preset.id).toBe("normal")
    })

    it("builds css filter for known preset", () => {
        const css = getInstagramFilterCss("clarendon")
        expect(css).toContain("brightness(")
        expect(css).toContain("contrast(")
    })

    it("parses instagram post urls as instagram_post", () => {
        const parsed = parseInstagramMediaInput("https://www.instagram.com/p/C5M0YfJt5gX/")
        expect(parsed?.kind).toBe("instagram_post")
        expect(parsed?.isHttps).toBe(true)
    })

    it("parses direct image urls as download candidates when authorized", () => {
        const parsed = parseInstagramMediaInput("https://example.com/public/photo.jpg?token=abc")
        expect(parsed?.kind).toBe("direct_image")
        expect(canDownloadAuthorizedInstagramMedia(parsed || null, true)).toBe(true)
        expect(canDownloadAuthorizedInstagramMedia(parsed || null, false)).toBe(false)
    })

    it("rejects dangerous protocols and blocks mixed-content downloads", () => {
        expect(parseInstagramMediaInput("javascript:alert(1)")).toBeNull()
        expect(parseInstagramMediaInput("data:image/png;base64,AAAA")).toBeNull()
        expect(parseInstagramMediaInput("ftp://example.com/photo.jpg")).toBeNull()

        const insecure = parseInstagramMediaInput("http://example.com/photo.jpg")
        expect(insecure?.kind).toBe("direct_image")
        expect(insecure?.isHttps).toBe(false)
        expect(canDownloadAuthorizedInstagramMedia(insecure || null, true)).toBe(false)
    })

    it("marks unsupported external assets as non-downloadable", () => {
        const parsed = parseInstagramMediaInput("https://example.com/photo.svg")
        expect(parsed?.kind).toBe("unsupported")
        expect(canDownloadAuthorizedInstagramMedia(parsed || null, true)).toBe(false)
    })

    it("derives safe filename from media url", () => {
        expect(getInstagramMediaFilename("https://example.com/my photo!.png")).toBe("my-photo.png")
        expect(getInstagramMediaFilename("javascript:alert(1)")).toBe("instagram-photo.jpg")
        expect(getInstagramMediaFilename("https://example.com/%E0%A4%A.png")).toBe("instagram-photo.jpg")
    })
})
