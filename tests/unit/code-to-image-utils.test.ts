import { describe, expect, it } from "vitest"
import { estimateCanvasSize, splitCodeLines } from "@/features/tools/code-to-image-converter/utils"

describe("code-to-image utils", () => {
    it("splits code into lines", () => {
        expect(splitCodeLines("a\nb\nc")).toEqual(["a", "b", "c"])
    })

    it("returns one empty line for empty input", () => {
        expect(splitCodeLines("")).toEqual([""])
    })

    it("estimates canvas dimensions with sane minimums", () => {
        const size = estimateCanvasSize(["const a = 1;"], 16, 24)
        expect(size.width).toBeGreaterThanOrEqual(320)
        expect(size.height).toBeGreaterThanOrEqual(180)
    })
})
