import { describe, expect, it } from "vitest"
import { assessRegexSafety, getRegexPerformanceWarnings, testRegexPattern } from "@/features/tools/regex-tester/utils"

describe("regex tester utils", () => {
    it("returns match summaries with captures", () => {
        const result = testRegexPattern("([A-Z][a-z]+)(\\d)", "g", "Ab1 Cd2")

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.matches).toEqual([
                { match: "Ab1", index: 0, groupIndex: 0, groups: ["Ab", "1"] },
                { match: "Cd2", index: 4, groupIndex: 1, groups: ["Cd", "2"] },
            ])
            expect(result.elapsedMs).toBeGreaterThanOrEqual(0)
        }
    })

    it("returns structured invalid regex errors", () => {
        const result = testRegexPattern("[", "g", "input")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error).toMatch(/Invalid regular expression/)
        }
    })

    it("blocks nested quantifier patterns before running them", () => {
        const pattern = "^(a+)+$"
        const input = `${"a".repeat(30)}X`

        expect(assessRegexSafety(pattern, input)).toMatch(/nested quantifiers/)
        const result = testRegexPattern(pattern, "g", input)

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error).toMatch(/catastrophic backtracking/)
        }
    })

    it("enforces pattern and input safety limits", () => {
        expect(testRegexPattern("a".repeat(501), "g", "aaa").ok).toBe(false)
        expect(testRegexPattern("a", "g", "a".repeat(20_001)).ok).toBe(false)
    })

    it("reports ambiguous alternation and slow evaluation diagnostics", () => {
        expect(getRegexPerformanceWarnings("(a|aa)+", "a".repeat(100))).toContain("Pattern contains repeated alternation that may backtrack on long input.")
        expect(getRegexPerformanceWarnings("a", "abc", 75)).toContain("Evaluation took 75 ms. Consider simplifying the pattern or testing a smaller sample.")
    })
})
