import { describe, expect, it } from "vitest"
import {
    decodeBase58ToBytes,
    decodeBase32ToText,
    decodeBase58ToText,
    encodeBytesToBase58,
    encodeTextToBase32,
    encodeTextToBase58,
} from "@/features/tools/base-encoding-converter/utils"

describe("base encoding converter utils", () => {
    it("encodes RFC 4648 Base32 with padding", () => {
        expect(encodeTextToBase32("foobar")).toBe("MZXW6YTBOI======")
    })

    it("round trips unicode text through Base32", () => {
        const input = "byteflow 你好"

        expect(decodeBase32ToText(encodeTextToBase32(input))).toBe(input)
    })

    it("encodes Bitcoin Base58 and preserves leading zero bytes", () => {
        expect(encodeTextToBase58("Hello World!")).toBe("2NEpo7TZRRrLZSi2U")
        expect(encodeBytesToBase58(new Uint8Array([0, 0, 1]))).toBe("112")
        expect(Array.from(decodeBase58ToBytes("112"))).toEqual([0, 0, 1])
    })

    it("round trips unicode text through Base58", () => {
        const input = "local only こんにちは"

        expect(decodeBase58ToText(encodeTextToBase58(input))).toBe(input)
    })

    it("rejects ambiguous Base58 characters", () => {
        expect(() => decodeBase58ToText("0OIl")).toThrow("Invalid Base58 character.")
    })
})
