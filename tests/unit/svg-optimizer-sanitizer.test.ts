import { describe, expect, it } from "vitest"
import { optimizeAndSanitizeSvg } from "@/features/tools/svg-optimizer/logic"

describe("svg optimizer sanitizer", () => {
    it("removes active SVG content from default output", () => {
        const output = optimizeAndSanitizeSvg(`
            <svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
                <script>alert(1)</script>
                <a href="javascript:alert(1)">
                    <circle cx="5" cy="5" r="4" />
                </a>
                <foreignObject><div onclick="alert(1)">x</div></foreignObject>
            </svg>
        `)

        expect(output).toContain("<svg")
        expect(output).toContain("<circle")
        expect(output).not.toMatch(/<script/i)
        expect(output).not.toMatch(/onload|onclick/i)
        expect(output).not.toMatch(/foreignObject/i)
        expect(output).not.toMatch(/javascript:/i)
    })
})
