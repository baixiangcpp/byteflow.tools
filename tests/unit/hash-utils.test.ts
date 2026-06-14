import { createHash, createHmac } from "node:crypto"
import { describe, expect, it } from "vitest"
import { hashBytes, hashHmac, hashText, hashTextByAlgorithm } from "@/core/utils/hash-utils"

describe("hash-utils", () => {
    it("hashText matches known hello vector", () => {
        const hashes = hashText("hello")
        expect(hashes.md5).toBe("5d41402abc4b2a76b9719d911017c592")
        expect(hashes.sha256).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824")
    })

    it("hashHmac matches Node crypto vectors", () => {
        const input = "The quick brown fox jumps over the lazy dog"
        const secret = "key"
        const hashes = hashHmac(input, secret)

        const expected256 = createHmac("sha256", secret).update(input).digest("hex")
        const expected512 = createHmac("sha512", secret).update(input).digest("hex")

        expect(hashes.sha256).toBe(expected256)
        expect(hashes.sha512).toBe(expected512)
    })

    it("hashBytes works for binary payloads", () => {
        const bytes = Uint8Array.from([0, 1, 2, 3, 127, 128, 254, 255])
        const hashes = hashBytes(bytes)
        const buffer = Buffer.from(bytes)

        expect(hashes.md5).toBe(createHash("md5").update(buffer).digest("hex"))
        expect(hashes.sha1).toBe(createHash("sha1").update(buffer).digest("hex"))
        expect(hashes.sha224).toBe(createHash("sha224").update(buffer).digest("hex"))
        expect(hashes.sha256).toBe(createHash("sha256").update(buffer).digest("hex"))
        expect(hashes.sha384).toBe(createHash("sha384").update(buffer).digest("hex"))
        expect(hashes.sha512).toBe(createHash("sha512").update(buffer).digest("hex"))
    })

    it("hashTextByAlgorithm returns the selected hash", () => {
        const input = "batch-line"
        const expected = createHash("sha256").update(input).digest("hex")
        expect(hashTextByAlgorithm(input, "sha256")).toBe(expected)
    })
})
