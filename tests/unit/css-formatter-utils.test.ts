import { describe, expect, it } from "vitest"
import { DEFAULT_CSS_FORMAT_OPTIONS, formatCssWithOptions } from "@/core/utils/css-formatter-utils"

describe("formatCssWithOptions", () => {
    it("formats a simple rule with indentation", () => {
        const result = formatCssWithOptions("a{color:red;}", DEFAULT_CSS_FORMAT_OPTIONS)
        expect(result).toBe("a {\n  color: red;\n}")
    })

    it("supports selector separator newline toggle", () => {
        const base = "a,b{color:red;}"
        const withNewline = formatCssWithOptions(base, {
            ...DEFAULT_CSS_FORMAT_OPTIONS,
            selectorSeparatorNewline: true,
        })
        const withoutNewline = formatCssWithOptions(base, {
            ...DEFAULT_CSS_FORMAT_OPTIONS,
            selectorSeparatorNewline: false,
        })
        expect(withNewline).toContain("a,\nb")
        expect(withoutNewline).toContain("a, b")
    })

    it("supports combinator spacing", () => {
        const base = "a>b{color:red;}"
        const spaced = formatCssWithOptions(base, {
            ...DEFAULT_CSS_FORMAT_OPTIONS,
            spaceAroundCombinator: true,
        })
        const compact = formatCssWithOptions(base, {
            ...DEFAULT_CSS_FORMAT_OPTIONS,
            spaceAroundCombinator: false,
        })
        expect(spaced).toContain("a > b")
        expect(compact).toContain("a>b")
    })

    it("supports end-with-newline option", () => {
        const withEol = formatCssWithOptions("a{color:red;}", {
            ...DEFAULT_CSS_FORMAT_OPTIONS,
            endWithNewline: true,
        })
        const withoutEol = formatCssWithOptions("a{color:red;}", {
            ...DEFAULT_CSS_FORMAT_OPTIONS,
            endWithNewline: false,
        })
        expect(withEol.endsWith("\n")).toBe(true)
        expect(withoutEol.endsWith("\n")).toBe(false)
    })
})
