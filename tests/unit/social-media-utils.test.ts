import { describe, expect, it } from "vitest"
import {
    formatCompactNumber,
    normalizeProgress,
    resolveSocialThemeColors,
    wrapLines,
} from "@/core/utils/social-media-utils"

describe("social-media-utils", () => {
    it("formats compact numbers", () => {
        expect(formatCompactNumber(999)).toBe("999")
        expect(formatCompactNumber(1200)).toBe("1.2K")
        expect(formatCompactNumber(2_500_000)).toBe("2.5M")
    })

    it("wraps text with max lines and ellipsis", () => {
        const lines = wrapLines("Build polished social visuals in minutes with byteflow tools", 18, 2)
        expect(lines.length).toBe(2)
        expect(lines[1].endsWith("…")).toBe(true)
    })

    it("returns theme colors", () => {
        const dark = resolveSocialThemeColors("dark")
        const light = resolveSocialThemeColors("light")
        expect(dark.textPrimary).not.toBe(light.textPrimary)
        expect(light.surface).toBe("#ffffff")
    })

    it("normalizes progress to [0,max]", () => {
        expect(normalizeProgress(-1)).toBe(0)
        expect(normalizeProgress(2, 1)).toBe(1)
        expect(normalizeProgress(0.35, 1)).toBe(0.35)
    })
})
