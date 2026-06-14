import { describe, expect, it } from "vitest"
import { decodeUrlByMode, encodeUrlByMode } from "@/core/utils/url-codec-utils"

describe("url-codec-utils", () => {
    const sampleUrl = "https://example.com/search?q=hello world&tag=a/b#top"

    it("encodes component mode with encodeURIComponent semantics", () => {
        const encoded = encodeUrlByMode(sampleUrl, "component")
        expect(encoded).toContain("https%3A%2F%2Fexample.com%2Fsearch")
        expect(encoded).toContain("hello%20world")
        expect(encoded).toContain("%23top")
    })

    it("encodes full mode with encodeURI semantics", () => {
        const encoded = encodeUrlByMode(sampleUrl, "full")
        expect(encoded).toContain("https://example.com/search?q=hello%20world&tag=a/b#top")
        expect(encoded.includes("%2F")).toBe(false)
    })

    it("encodes reserved mode while preserving reserved delimiters", () => {
        const encoded = encodeUrlByMode("path:/users?id=42&role=dev ops", "reserved")
        expect(encoded).toBe("path:/users?id=42&role=dev%20ops")
    })

    it("decodes by mode", () => {
        expect(decodeUrlByMode("hello%20world", "component")).toBe("hello world")
        expect(decodeUrlByMode("https://example.com/a%20b?q=1#x", "full")).toBe("https://example.com/a b?q=1#x")
        expect(decodeUrlByMode("path:/users?id=42&role=dev%20ops", "reserved")).toBe("path:/users?id=42&role=dev ops")
    })
})
