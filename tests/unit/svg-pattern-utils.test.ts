import { describe, expect, it } from "vitest"
import { buildPatternCss, buildPatternShape, buildPatternSvg } from "@/features/tools/svg-pattern-generator/utils"

const baseConfig = {
    kind: "dots" as const,
    tileSize: 32,
    gap: 10,
    strokeWidth: 2,
    foreground: "#0ea5e9",
    background: "#020617",
    width: 400,
    height: 240,
}

describe("svg-pattern-utils", () => {
    it("builds pattern shapes for each kind", () => {
        expect(buildPatternShape({ ...baseConfig, kind: "dots" })).toContain("<circle")
        expect(buildPatternShape({ ...baseConfig, kind: "grid" })).toContain("<path")
        expect(buildPatternShape({ ...baseConfig, kind: "diagonal" })).toContain("<path")
    })

    it("builds complete pattern svg", () => {
        const svg = buildPatternSvg(baseConfig)
        expect(svg).toContain("<pattern")
        expect(svg).toContain('fill="url(#p)"')
    })

    it("builds CSS snippet with data URI", () => {
        const css = buildPatternCss("data:image/svg+xml,%3Csvg%3E")
        expect(css).toContain("background-image")
        expect(css).toContain("data:image/svg+xml")
    })
})
