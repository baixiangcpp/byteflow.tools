import { describe, expect, it } from "vitest"
import { convertStrokeToFill } from "@/features/tools/svg-stroke-to-fill-converter/utils"

describe("svg-stroke-fill-utils", () => {
    it("converts line stroke to filled polygon", () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="100" y2="0" stroke="#000" stroke-width="10"/></svg>`
        const result = convertStrokeToFill(input)
        expect(result.error).toBeUndefined()
        expect(result.converted).toBe(1)
        expect(result.svg).toContain("<polygon")
        expect(result.svg).not.toContain("<line")
    })

    it("converts circle stroke to filled ring path", () => {
        const input = `<svg xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="20" stroke="#111" stroke-width="6" fill="none"/></svg>`
        const result = convertStrokeToFill(input)
        expect(result.converted).toBe(1)
        expect(result.svg).toContain("<path")
        expect(result.svg).toContain('fill="#111"')
    })

    it("returns error for invalid svg input", () => {
        const result = convertStrokeToFill("<svg><broken")
        expect(result.error).toBeDefined()
    })
})
