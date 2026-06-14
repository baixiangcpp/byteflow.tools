import { describe, expect, it } from "vitest"
import {
    generateAiPalette,
    generateColorShades,
    mixColorsHsl,
    mixColorsRgb,
    paletteToCssVars,
    shadesToCssVars,
} from "@/core/utils/color-generator-utils"

describe("color-generator-utils", () => {
    it("generates ai palette with deterministic count and hex output", () => {
        const palette = generateAiPalette("#3b82f6", "ocean", 8)
        expect(palette).toHaveLength(8)
        expect(palette[0]).toMatch(/^#[0-9A-F]{6}$/)
        expect(palette[4]).toMatch(/^#[0-9A-F]{6}$/)
    })

    it("mixes two colors in rgb space", () => {
        const mixed = mixColorsRgb("#FF0000", "#0000FF", 0.5)
        expect(mixed).toBe("#800080")
    })

    it("mixes two colors in hsl space", () => {
        const mixed = mixColorsHsl("#FF0000", "#00FF00", 0.5)
        expect(mixed).toMatch(/^#[0-9A-F]{6}$/)
        expect(mixed).not.toBe("#808000")
    })

    it("builds 10-step shade scale", () => {
        const shades = generateColorShades("#3b82f6", 10)
        expect(shades).toHaveLength(10)
        expect(shades[0].label).toBe("50")
        expect(shades[9].label).toBe("900")
        expect(shades[5].color).toMatch(/^#[0-9A-F]{6}$/)
    })

    it("formats css variable outputs for palette and shades", () => {
        const paletteCss = paletteToCssVars(["#ffffff", "#000000"])
        const shadesCss = shadesToCssVars([
            { label: "50", color: "#ffffff" },
            { label: "900", color: "#000000" },
        ])

        expect(paletteCss).toContain("--palette-1: #FFFFFF;")
        expect(shadesCss).toContain("--color-900: #000000;")
    })
})
