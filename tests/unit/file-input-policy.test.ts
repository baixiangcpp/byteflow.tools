import { describe, expect, it } from "vitest"
import {
    FILE_INPUT_POLICIES,
    filterFilesByPolicy,
    formatFilePolicyLimit,
    formatPixelLimit,
    readArrayBufferWithPolicy,
    readTextFileWithPolicy,
    validateFileAgainstPolicy,
} from "@/core/files/file-input-policy"

describe("file-input-policy", () => {
    it("declares limits for each supported file input class", () => {
        expect(FILE_INPUT_POLICIES.text.maxBytes).toBe(2 * 1024 * 1024)
        expect(FILE_INPUT_POLICIES["csv-json"].maxBytes).toBe(1024 * 1024)
        expect(FILE_INPUT_POLICIES["base64-file"].maxBytes).toBe(10 * 1024 * 1024)
        expect(FILE_INPUT_POLICIES["hash-file"].maxBytes).toBe(50 * 1024 * 1024)
        expect(FILE_INPUT_POLICIES["image-standard"].maxPixels).toBe(24_000_000)
        expect(FILE_INPUT_POLICIES["image-compact"].maxPixels).toBe(16_000_000)
        expect(formatPixelLimit(FILE_INPUT_POLICIES["scan-image"].maxPixels ?? 0)).toBe("24 MP")
        expect(FILE_INPUT_POLICIES["scan-image"].maxFiles).toBe(20)
        expect(formatFilePolicyLimit(FILE_INPUT_POLICIES["recipe-json"])).toBe("256 KB")
    })

    it("rejects empty, oversized, and unsupported files", () => {
        const textPolicy = FILE_INPUT_POLICIES.text
        expect(validateFileAgainstPolicy(new File([], "empty.txt", { type: "text/plain" }), textPolicy)).toMatchObject({ ok: false, reason: "empty" })
        expect(validateFileAgainstPolicy(new File(["x".repeat(textPolicy.maxBytes + 1)], "large.txt", { type: "text/plain" }), textPolicy)).toMatchObject({ ok: false, reason: "too_large" })
        expect(validateFileAgainstPolicy(new File(["{}"], "payload.exe", { type: "application/octet-stream" }), textPolicy)).toMatchObject({ ok: false, reason: "unsupported_type" })
    })

    it("accepts safe extension fallbacks when browsers omit MIME type", () => {
        expect(validateFileAgainstPolicy(new File(["{}"], "payload.json", { type: "" }), FILE_INPUT_POLICIES.text)).toMatchObject({ ok: true })
        expect(validateFileAgainstPolicy(new File(["<svg />"], "icon.svg", { type: "" }), FILE_INPUT_POLICIES.svg)).toMatchObject({ ok: true })
    })

    it("reads only files that pass policy validation", async () => {
        await expect(readTextFileWithPolicy(new File(["alpha"], "sample.txt", { type: "text/plain" }))).resolves.toBe("alpha")
        await expect(readArrayBufferWithPolicy(new File([new Uint8Array([1, 2])], "sample.bin"), FILE_INPUT_POLICIES["hash-file"])).resolves.toBeInstanceOf(ArrayBuffer)
        await expect(readTextFileWithPolicy(new File(["bad"], "bad.bin", { type: "application/octet-stream" }))).rejects.toThrow(/Unsupported/)
    })

    it("filters multi-file imports without exceeding the policy count", () => {
        const files = [
            new File(["a"], "1.png", { type: "image/png" }),
            new File(["b"], "2.jpg", { type: "image/jpeg" }),
            new File(["c"], "3.exe", { type: "application/octet-stream" }),
        ]
        const result = filterFilesByPolicy(files, { ...FILE_INPUT_POLICIES["scan-image"], maxFiles: 2 })
        expect(result.accepted.map((file) => file.name)).toEqual(["1.png", "2.jpg"])
        expect(result.rejected).toEqual([])
    })
})
