import { describe, expect, it } from "vitest"
import { decodeMessagePack } from "./logic"

describe("messagepack-inspector logic", () => {
    it("decodes a MessagePack map from hex", () => {
        const report = decodeMessagePack("82a2696401a46e616d65a5416c696365", "hex")
        expect(report.value).toEqual({ id: 1, name: "Alice" })
        expect(report.summary).toContain("map")
    })

    it("decodes arrays and booleans", () => {
        expect(decodeMessagePack("93c3c2c0", "hex").value).toEqual([true, false, null])
    })

    it("rejects invalid hex with actionable errors", () => {
        expect(() => decodeMessagePack("abc", "hex")).toThrow("even number")
    })

    it("decodes float32 and float64 values", () => {
        expect(decodeMessagePack("ca40490fdb", "hex").value).toBeCloseTo(3.1415927)
        expect(decodeMessagePack("cb400921fb54442d18", "hex").value).toBeCloseTo(Math.PI)
    })

    it("keeps non-finite floats JSON-safe", () => {
        const report = decodeMessagePack("ca7fc00000", "hex")

        expect(report.value).toEqual({ type: "float32", value: "NaN" })
        expect(report.json).toContain('"value": "NaN"')
        expect(report.summary).toContain("float32")
    })

    it("decodes 32-bit and 64-bit integers without losing 64-bit precision", () => {
        expect(decodeMessagePack("d2fffffffe", "hex").value).toBe(-2)
        expect(decodeMessagePack("cf000000000000002a", "hex").value).toEqual({ type: "uint64", value: "42" })
        expect(decodeMessagePack("cfffffffffffffffff", "hex").value).toEqual({ type: "uint64", value: "18446744073709551615" })
        expect(decodeMessagePack("d3fffffffffffffffe", "hex").value).toEqual({ type: "int64", value: "-2" })
        expect(decodeMessagePack("d38000000000000000", "hex").value).toEqual({ type: "int64", value: "-9223372036854775808" })
    })

    it("decodes str32, bin32, array32, and map32", () => {
        expect(decodeMessagePack("db0000000568656c6c6f", "hex").value).toBe("hello")
        expect(decodeMessagePack("c6000000030102ff", "hex").value).toEqual({
            type: "binary",
            length: 3,
            hex: "0102ff",
            base64: "AQL/",
        })
        expect(decodeMessagePack("dd00000003c3c2c0", "hex").value).toEqual([true, false, null])
        expect(decodeMessagePack("df00000001a16bcc2a", "hex").value).toEqual({ k: 42 })
    })

    it("decodes fixed extension families as JSON-safe objects", () => {
        expect(decodeMessagePack("d401aa", "hex").value).toEqual({
            type: "extension",
            extensionType: 1,
            length: 1,
            hex: "aa",
            base64: "qg==",
        })
        expect(decodeMessagePack("d502aabb", "hex").value).toMatchObject({ type: "extension", extensionType: 2, length: 2, hex: "aabb" })
        expect(decodeMessagePack("d60301020304", "hex").value).toMatchObject({ type: "extension", extensionType: 3, length: 4, hex: "01020304" })
        expect(decodeMessagePack("d7040102030405060708", "hex").value).toMatchObject({ type: "extension", extensionType: 4, length: 8, hex: "0102030405060708" })
        expect(decodeMessagePack("d805000102030405060708090a0b0c0d0e0f", "hex").value).toMatchObject({
            type: "extension",
            extensionType: 5,
            length: 16,
            hex: "000102030405060708090a0b0c0d0e0f",
        })
    })

    it("decodes ext8, ext16, and ext32", () => {
        expect(decodeMessagePack("c702feabcd", "hex").value).toEqual({
            type: "extension",
            extensionType: -2,
            length: 2,
            hex: "abcd",
            base64: "q80=",
        })
        expect(decodeMessagePack("c8000307010203", "hex").value).toMatchObject({ type: "extension", extensionType: 7, length: 3, hex: "010203" })
        expect(decodeMessagePack("c9000000040801020304", "hex").value).toMatchObject({
            type: "extension",
            extensionType: 8,
            length: 4,
            hex: "01020304",
        })
    })

    it("recognizes timestamp extensions", () => {
        const report = decodeMessagePack("d6ff00000001", "hex")

        expect(report.value).toEqual({
            type: "timestamp",
            extensionType: -1,
            length: 4,
            seconds: "1",
            nanoseconds: 0,
            iso: "1970-01-01T00:00:01.000Z",
            hex: "00000001",
        })
        expect(report.summary).toContain("timestamp")
    })

    it("falls back to generic extension output for unrecognized timestamp payloads", () => {
        expect(decodeMessagePack("d5ff0001", "hex").value).toEqual({
            type: "extension",
            extensionType: -1,
            length: 2,
            hex: "0001",
            base64: "AAE=",
        })
    })
})
