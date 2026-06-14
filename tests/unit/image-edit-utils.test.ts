import { describe, expect, it } from "vitest"
import { buildCssFilterString, normalizeCropPercent, percentCropToPixels } from "@/core/utils/image-edit-utils"

describe("image-edit-utils", () => {
    it("normalizes crop percent within bounds", () => {
        const rect = normalizeCropPercent({
            x: 90,
            y: 80,
            width: 30,
            height: 40,
        })

        expect(rect).toEqual({ x: 70, y: 60, width: 30, height: 40 })
    })

    it("converts percentage crop to pixel rectangle", () => {
        const pixels = percentCropToPixels(1920, 1080, {
            x: 10,
            y: 20,
            width: 40,
            height: 30,
        })

        expect(pixels).toEqual({
            x: 192,
            y: 216,
            width: 768,
            height: 324,
        })
    })

    it("builds css filter string with clamped values", () => {
        const filter = buildCssFilterString({
            brightness: 120,
            contrast: 105,
            saturation: 140,
            grayscale: 10,
            blur: 2.5,
        })

        expect(filter).toBe("brightness(120%) contrast(105%) saturate(140%) grayscale(10%) blur(2.5px)")
    })
})
