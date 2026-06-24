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
})
