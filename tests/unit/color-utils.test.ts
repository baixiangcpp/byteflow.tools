import { describe, expect, it } from "vitest"
import { clampAlpha, clampRgbChannel, formatRgba, parseHexToRgb, rgbToHex, rgbaToHex8 } from "@/core/utils/color-utils"

describe("color-utils", () => {
    it("parses short and long hex formats", () => {
        expect(parseHexToRgb("#f00")).toEqual({ r: 255, g: 0, b: 0 })
        expect(parseHexToRgb("#336699")).toEqual({ r: 51, g: 102, b: 153 })
    })

    it("supports hex with alpha by ignoring alpha channel for rgb extraction", () => {
        expect(parseHexToRgb("#336699aa")).toEqual({ r: 51, g: 102, b: 153 })
    })

    it("returns null for invalid hex", () => {
        expect(parseHexToRgb("not-a-color")).toBeNull()
        expect(parseHexToRgb("#12")).toBeNull()
    })

    it("clamps and formats alpha values", () => {
        expect(clampAlpha(-1)).toBe(0)
        expect(clampAlpha(1.234)).toBe(1)
        expect(formatRgba({ r: 255, g: 0, b: 0 }, 0.456)).toBe("rgba(255, 0, 0, 0.46)")
    })

    it("converts rgba channels to hex and hex8", () => {
        expect(clampRgbChannel(300)).toBe(255)
        expect(rgbToHex({ r: 255, g: 0, b: 0 })).toBe("#FF0000")
        expect(rgbaToHex8({ r: 255, g: 0, b: 0 }, 0.5)).toBe("#FF000080")
    })
})
