import { describe, expect, it } from "vitest"
import { buildBlobPath, buildBlobSvg } from "@/features/tools/svg-blob-generator/utils"

describe("svg-blob-utils", () => {
    it("generates deterministic path for same seed", () => {
        const one = buildBlobPath({ size: 320, points: 8, randomness: 40, seed: 42 })
        const two = buildBlobPath({ size: 320, points: 8, randomness: 40, seed: 42 })
        expect(one).toBe(two)
        expect(one.startsWith("M ")).toBe(true)
        expect(one.endsWith(" Z")).toBe(true)
    })

    it("builds a complete blob svg", () => {
        const path = buildBlobPath({ size: 256, points: 7, randomness: 25, seed: 7 })
        const svg = buildBlobSvg(path, 256, "#22d3ee", "#0f172a")
        expect(svg).toContain("<svg")
        expect(svg).toContain("<path")
        expect(svg).toContain('fill="#22d3ee"')
    })
})
