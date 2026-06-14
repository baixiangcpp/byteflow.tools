import { describe, expect, it } from "vitest"
import { averageHexFromPixels, averageRgbFromPixels, extractPaletteFromPixels, rgbToString } from "@/core/utils/image-color-utils"

describe("image-color-utils", () => {
    it("computes average rgb from pixels", () => {
        const pixels = new Uint8ClampedArray([
            255, 0, 0, 255,
            0, 255, 0, 255,
            0, 0, 255, 255,
            255, 255, 255, 255,
        ])

        const avg = averageRgbFromPixels(pixels)
        expect(avg).toEqual({ r: 128, g: 128, b: 128 })
        expect(averageHexFromPixels(pixels)).toBe("#808080")
    })

    it("ignores transparent pixels while averaging", () => {
        const pixels = new Uint8ClampedArray([
            255, 0, 0, 0,
            20, 40, 60, 255,
        ])

        expect(averageHexFromPixels(pixels)).toBe("#14283C")
    })

    it("extracts dominant palette from pixels", () => {
        const pixels = new Uint8ClampedArray([
            250, 20, 20, 255,
            252, 18, 18, 255,
            20, 220, 40, 255,
            18, 222, 44, 255,
            20, 20, 230, 255,
            18, 18, 228, 255,
        ])

        const palette = extractPaletteFromPixels(pixels, 3)
        expect(palette).toHaveLength(3)
        expect(palette.every((item) => /^#[0-9A-F]{6}$/.test(item))).toBe(true)
    })

    it("formats rgb string output", () => {
        expect(rgbToString({ r: 12, g: 34, b: 56 })).toBe("rgb(12, 34, 56)")
    })
})
