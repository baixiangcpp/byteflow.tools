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

    it("derives safe filename from media url", () => {
        expect(getInstagramMediaFilename("https://example.com/my photo!.png")).toBe("my-photo-.png")
    })
})
