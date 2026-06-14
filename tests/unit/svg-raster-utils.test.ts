import { describe, expect, it } from "vitest"
import { ensureSvgMarkup, extractSvgDimensions, normalizeRasterDimension } from "@/features/tools/svg-to-png-converter/utils"

describe("svg-raster-utils", () => {
    it("normalizes raster dimensions into safe range", () => {
        expect(normalizeRasterDimension(0, 600)).toBe(600)
        expect(normalizeRasterDimension(16, 600)).toBe(32)
        expect(normalizeRasterDimension(9000, 600)).toBe(4096)
    })

    it("extracts width and height attributes from svg markup", () => {
        const dims = extractSvgDimensions(`<svg width="800" height="450" viewBox="0 0 100 100"></svg>`)
        expect(dims).toEqual({ width: 800, height: 450 })
    })

    it("falls back to viewBox dimensions when width/height attrs are missing", () => {
        const dims = extractSvgDimensions(`<svg viewBox="0 0 1280 720"></svg>`)
        expect(dims).toEqual({ width: 1280, height: 720 })
    })

    it("validates svg markup presence", () => {
        expect(() => ensureSvgMarkup(`<div>no svg</div>`)).toThrow()
        expect(ensureSvgMarkup(`  <svg viewBox="0 0 10 10"></svg>`)).toContain("<svg")
    })
})
