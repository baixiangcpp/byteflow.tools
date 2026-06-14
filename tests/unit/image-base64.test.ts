import { describe, expect, it } from "vitest"
import { parseBase64Image, sanitizeBase64 } from "@/features/tools/image-base64/utils"

describe("image-base64 helpers", () => {
    it("normalizes valid raw PNG payloads into image data URIs", () => {
        const result = parseBase64Image("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8Z0AAAAASUVORK5CYII=")

        expect(result).toMatchObject({
            ok: true,
            data: {
                mime: "image/png",
            },
        })
        expect(result.ok && result.data.dataUri.startsWith("data:image/png;base64,")).toBe(true)
    })

    it("accepts data URIs with extra parameters and preserves declared image mime", () => {
        const result = parseBase64Image(
            "data:image/svg+xml;charset=utf-8;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg==",
        )

        expect(result).toMatchObject({
            ok: true,
            data: {
                mime: "image/svg+xml",
            },
        })
    })

    it("rejects non-image raw Base64 payloads instead of treating them as PNG", () => {
        expect(parseBase64Image("aGVsbG8gd29ybGQ=")).toEqual({
            ok: false,
            reason: "invalid_base64_payload",
        })
    })

    it("strips whitespace from Base64 payloads", () => {
        expect(sanitizeBase64("aG Vs\nbG8=")).toBe("aGVsbG8=")
    })
})
