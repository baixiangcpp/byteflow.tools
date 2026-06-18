import { describe, expect, it } from "vitest"
import { testRegexPattern } from "@/features/tools/regex-tester/utils"

describe("regex tester utils", () => {
    it("returns match summaries with captures", () => {
        const result = testRegexPattern("([A-Z][a-z]+)(\\d)", "g", "Ab1 Cd2")

        expect(result.ok).toBe(true)
        if (result.ok) {
            expect(result.matches).toEqual([
                { match: "Ab1", index: 0, groupIndex: 0, groups: ["Ab", "1"] },
                { match: "Cd2", index: 4, groupIndex: 1, groups: ["Cd", "2"] },
            ])
        }
    })

    it("returns structured invalid regex errors", () => {
        const result = testRegexPattern("[", "g", "input")

        expect(result.ok).toBe(false)
        if (!result.ok) {
            expect(result.error).toMatch(/Invalid regular expression/)
        }
    })
})
