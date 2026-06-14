import { describe, expect, it } from "vitest"
import { intensityToBlockSize, normalizeCensorRect, percentRectToPixels } from "@/features/tools/photo-censor/utils"

describe("image-censor-utils", () => {
    it("normalizes censor rectangles within bounds", () => {
        const rect = normalizeCensorRect({ x: 85, y: 90, width: 30, height: 25 })
        expect(rect).toEqual({ x: 70, y: 75, width: 30, height: 25 })
    })

    it("converts percent rect to pixel rect", () => {
        const pixels = percentRectToPixels(1000, 800, { x: 10, y: 20, width: 40, height: 50 })
        expect(pixels).toEqual({ x: 100, y: 160, width: 400, height: 400 })
    })

    it("converts intensity to sensible block size", () => {
        expect(intensityToBlockSize(1)).toBeGreaterThanOrEqual(4)
        expect(intensityToBlockSize(100)).toBeLessThanOrEqual(48)
        expect(intensityToBlockSize(50)).toBeGreaterThan(intensityToBlockSize(10))
    })
})
