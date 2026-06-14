import { describe, expect, it } from "vitest"
import { removeExtraWhitespace } from "@/core/utils/whitespace-utils"

describe("removeExtraWhitespace", () => {
    it("collapses spaces, tabs, and newlines into single spaces", () => {
        const input = "Hello   world\t\tfrom\n\nByteFlow"
        expect(removeExtraWhitespace(input)).toBe("Hello world from ByteFlow")
    })

    it("returns empty string for blank input", () => {
        expect(removeExtraWhitespace("   \n\t")).toBe("")
    })

    it("trims leading and trailing whitespace", () => {
        expect(removeExtraWhitespace("   keep this   ")).toBe("keep this")
    })
})
