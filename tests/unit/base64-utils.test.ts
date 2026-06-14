import { describe, expect, it } from "vitest"
import {
    decodeBase64ToBytes,
    decodeBase64ToText,
    encodeBytesToBase64,
    encodeTextToBase64,
    fromUrlSafeBase64,
    toUrlSafeBase64,
} from "@/core/utils/base64-utils"

describe("base64 utils", () => {
    it("encodes and decodes unicode text", () => {
        const input = "Hello byteflow! 你好"
        const encoded = encodeTextToBase64(input)
        const decoded = decodeBase64ToText(encoded)
        expect(decoded).toBe(input)
    })

    it("converts standard base64 to url-safe format and back", () => {
        const standard = "Pz8/Pw=="
        const urlSafe = toUrlSafeBase64(standard)
        expect(urlSafe).toBe("Pz8_Pw")
        expect(fromUrlSafeBase64(urlSafe)).toBe(standard)
    })

    it("encodes and decodes binary bytes without loss", () => {
        const bytes = new Uint8Array([0, 12, 255, 22, 88, 171, 42, 9])
        const encoded = encodeBytesToBase64(bytes)
        const decoded = decodeBase64ToBytes(encoded)
        expect(Array.from(decoded)).toEqual(Array.from(bytes))
    })
})
