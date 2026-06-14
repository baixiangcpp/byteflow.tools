import { describe, expect, it } from "vitest"
import { formatByteSize, hasCompressionStreamSupport, runCompressionLab, validateBase64Input } from "../../src/lib/gzip-brotli-utils"

describe("gzip-brotli-utils", () => {
    it("formats byte sizes", () => {
        expect(formatByteSize(512)).toBe("512 B")
        expect(formatByteSize(1536)).toBe("1.5 KB")
    })

    it("validates base64 input", () => {
        expect(validateBase64Input("SGVsbG8=")).toBe(true)
        expect(validateBase64Input("not base64%%%")).toBe(false)
    })

    it("round-trips gzip when CompressionStream is available", async () => {
        if (!hasCompressionStreamSupport("gzip")) {
            expect(hasCompressionStreamSupport("gzip")).toBe(false)
            return
        }

        const compressed = await runCompressionLab("hello hello hello", {
            mode: "compress",
            format: "gzip",
            inputEncoding: "text",
            outputEncoding: "base64",
        })
        const decompressed = await runCompressionLab(compressed.output, {
            mode: "decompress",
            format: "gzip",
            inputEncoding: "base64",
            outputEncoding: "text",
        })

        expect(decompressed.output).toBe("hello hello hello")
    })

    it("round-trips a larger gzip payload without blocking stream reads", async () => {
        if (!hasCompressionStreamSupport("gzip")) {
            expect(hasCompressionStreamSupport("gzip")).toBe(false)
            return
        }

        const input = "request_id=abc123 level=info message=cache_miss\n".repeat(6 * 1024)
        const compressed = await runCompressionLab(input, {
            mode: "compress",
            format: "gzip",
            inputEncoding: "text",
            outputEncoding: "base64",
        })
        const decompressed = await runCompressionLab(compressed.output, {
            mode: "decompress",
            format: "gzip",
            inputEncoding: "base64",
            outputEncoding: "text",
        })

        expect(input.length).toBeGreaterThan(256 * 1024)
        expect(decompressed.output).toBe(input)
    })
})
