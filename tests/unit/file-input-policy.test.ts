import { describe, expect, it } from "vitest"
import {
    FILE_INPUT_POLICIES,
    detectRasterImageMime,
    filterFilesByPolicy,
    formatFilePolicyLimit,
    formatPixelLimit,
    readArrayBufferWithPolicy,
    readTextFileWithPolicy,
    validateFileAgainstPolicy,
    validateFileContentAgainstPolicy,
} from "@/core/files/file-input-policy"

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

describe("file-input-policy", () => {
    it("declares limits for each supported file input class", () => {
        expect(FILE_INPUT_POLICIES.text.maxBytes).toBe(2 * 1024 * 1024)
        expect(FILE_INPUT_POLICIES["csv-json"].maxBytes).toBe(1024 * 1024)
        expect(FILE_INPUT_POLICIES["base64-file"].maxBytes).toBe(10 * 1024 * 1024)
        expect(FILE_INPUT_POLICIES["hash-file"].maxBytes).toBe(50 * 1024 * 1024)
        expect(FILE_INPUT_POLICIES["image-standard"].maxPixels).toBe(24_000_000)
        expect(FILE_INPUT_POLICIES["image-compact"].maxPixels).toBe(16_000_000)
        expect(FILE_INPUT_POLICIES["qr-decode-image"]).toMatchObject({
            maxBytes: 8 * 1024 * 1024,
            maxPixels: 12_000_000,
        })
        expect(FILE_INPUT_POLICIES["qr-decode-image"].accept).toBe(".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp")
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

    it("accepts extension-matched files when browsers omit or generalize MIME types", async () => {
        expect(validateFileAgainstPolicy(new File(["{}"], "payload.json", { type: "" }), FILE_INPUT_POLICIES.text)).toMatchObject({ ok: true })
        expect(validateFileAgainstPolicy(new File(["<svg />"], "icon.svg", { type: "" }), FILE_INPUT_POLICIES.svg)).toMatchObject({ ok: true })
        expect(validateFileAgainstPolicy(new File(["a,b"], "data.csv", { type: "application/vnd.ms-excel" }), FILE_INPUT_POLICIES["csv-json"])).toMatchObject({ ok: true })
        expect(validateFileAgainstPolicy(new File(["{}"], "payload.json", { type: "application/octet-stream" }), FILE_INPUT_POLICIES.text)).toMatchObject({ ok: true })

        const genericPng = new File([PNG_SIGNATURE], "safe.png", { type: "application/octet-stream" })
        expect(validateFileAgainstPolicy(genericPng, FILE_INPUT_POLICIES["image-standard"])).toMatchObject({ ok: true })
        await expect(validateFileContentAgainstPolicy(genericPng, FILE_INPUT_POLICIES["image-standard"])).resolves.toMatchObject({ ok: true })
    })

    it("keeps raw SVG out of generic raster image policies", () => {
        for (const policyId of ["image-standard", "image-compact", "image-logo", "qr-decode-image"] as const) {
            const policy = FILE_INPUT_POLICIES[policyId]
            expect(policy.accept).not.toContain("image/*")
            expect(policy.allowedExtensions).not.toContain(".svg")
            expect(policy.allowedMimeTypes).not.toContain("image/svg+xml")
            expect(validateFileAgainstPolicy(new File(["<svg />"], "unsafe.svg", { type: "image/svg+xml" }), policy)).toMatchObject({
                ok: false,
                reason: "unsupported_type",
            })
            expect(validateFileAgainstPolicy(new File(["<svg />"], "unsafe.svg", { type: "image/png" }), policy)).toMatchObject({
                ok: false,
                reason: "unsupported_type",
            })
            expect(validateFileAgainstPolicy(new File(["<svg />"], "unsafe.png", { type: "image/svg+xml" }), policy)).toMatchObject({
                ok: false,
                reason: "unsupported_type",
            })
        }

        expect(validateFileAgainstPolicy(new File(["<svg />"], "safe.svg", { type: "image/svg+xml" }), FILE_INPUT_POLICIES.svg)).toMatchObject({ ok: true })
    })

    it("detects supported raster signatures and rejects spoofed raster content", async () => {
        expect(detectRasterImageMime(PNG_SIGNATURE)).toBe("image/png")
        expect(detectRasterImageMime(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"))).toBeNull()

        const extensionFallback = new File([PNG_SIGNATURE], "safe.png", { type: "" })
        await expect(validateFileContentAgainstPolicy(extensionFallback, FILE_INPUT_POLICIES["image-standard"])).resolves.toMatchObject({ ok: true })

        const svgBytes = new TextEncoder().encode("\ufeff  <svg xmlns='http://www.w3.org/2000/svg'></svg>")
        const spoofedRaster = new File([svgBytes], "unsafe.png", { type: "image/png" })
        await expect(validateFileContentAgainstPolicy(spoofedRaster, FILE_INPUT_POLICIES["image-standard"])).resolves.toMatchObject({
            ok: false,
            reason: "unsupported_type",
        })
        await expect(readArrayBufferWithPolicy(spoofedRaster, FILE_INPUT_POLICIES["image-standard"])).rejects.toThrow(/does not match/)
    })

    it("requires raster extensions, declared MIME types, and signatures to agree", async () => {
        const mismatchedExtension = new File([PNG_SIGNATURE], "unsafe.jpg", { type: "image/png" })
        await expect(validateFileContentAgainstPolicy(mismatchedExtension, FILE_INPUT_POLICIES["image-standard"])).resolves.toMatchObject({ ok: false })

        const svgMimeWithRasterExtension = new File([PNG_SIGNATURE], "unsafe.png", { type: "image/svg+xml" })
        expect(validateFileAgainstPolicy(svgMimeWithRasterExtension, FILE_INPUT_POLICIES["scan-image"])).toMatchObject({ ok: false })
        expect(FILE_INPUT_POLICIES["scan-image"].accept).not.toContain("image/*")
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
