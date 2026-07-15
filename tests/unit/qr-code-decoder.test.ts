import { describe, expect, it, vi } from "vitest"
import {
    decodeQrImageData,
    decodeQrImageFile,
    createRetryableQrDecoderLoader,
    type QrDecoder,
} from "@/features/tools/qr-code-generator/browser-actions"
import { FILE_INPUT_POLICIES } from "@/core/files/file-input-policy"

function decoderReturning(payload: string | null) {
    return vi.fn(() => payload ? { data: payload } : null) as unknown as QrDecoder
}

describe("QR image decoder", () => {
    it("retries loading the decoder after a transient chunk failure", async () => {
        const decoder = decoderReturning("retry-success")
        const loader = vi.fn()
            .mockRejectedValueOnce(new Error("offline"))
            .mockResolvedValueOnce(decoder)
        const loadDecoder = createRetryableQrDecoderLoader(loader)

        await expect(loadDecoder()).rejects.toThrow("offline")
        await expect(loadDecoder()).resolves.toBe(decoder)
        expect(loader).toHaveBeenCalledTimes(2)
    })

    it("returns the payload from an injected local decoder", () => {
        const decoder = decoderReturning("https://byteflow.tools/decoded")
        const imageData = {
            data: new Uint8ClampedArray(4 * 3 * 2),
            width: 3,
            height: 2,
        }

        expect(decodeQrImageData(imageData, decoder)).toEqual({
            ok: true,
            payload: "https://byteflow.tools/decoded",
            width: 3,
            height: 2,
        })
        expect(decoder).toHaveBeenCalledWith(imageData.data, 3, 2, {
            inversionAttempts: "attemptBoth",
        })
    })

    it("reports a clear no-QR result", () => {
        const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 }
        expect(decodeQrImageData(imageData, decoderReturning(null))).toEqual({ ok: false, error: "no_qr" })
    })

    it("rejects empty, oversized, and unsupported files before loading the decoder", async () => {
        const policy = FILE_INPUT_POLICIES["qr-decode-image"]
        await expect(decodeQrImageFile(new File([], "empty.png", { type: "image/png" }))).resolves.toEqual({
            ok: false,
            error: "empty_file",
        })
        await expect(decodeQrImageFile(new File(
            [new Uint8Array(policy.maxBytes + 1)],
            "large.png",
            { type: "image/png" },
        ))).resolves.toEqual({ ok: false, error: "too_large" })
        await expect(decodeQrImageFile(new File(["<svg />"], "code.svg", { type: "image/svg+xml" }))).resolves.toEqual({
            ok: false,
            error: "unsupported_type",
        })
    })

    it("rejects SVG content disguised as a PNG", async () => {
        const disguisedSvg = new File(["<svg xmlns=\"http://www.w3.org/2000/svg\" />"], "code.png", {
            type: "image/png",
        })
        await expect(decodeQrImageFile(disguisedSvg, decoderReturning("should-not-run"))).resolves.toEqual({
            ok: false,
            error: "unsupported_type",
        })
    })
})
