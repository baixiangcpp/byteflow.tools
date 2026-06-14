import { describe, expect, it } from "vitest"
import { formatLetterCounterSummary, getLetterCounterStats } from "@/features/tools/letter-counter/utils"

describe("letter counter utils", () => {
    it("computes expected text metrics", () => {
        const stats = getLetterCounterStats("Hello 123\nWorld")

        expect(stats.characters).toBe(15)
        expect(stats.charactersNoSpaces).toBe(13)
        expect(stats.words).toBe(3)
        expect(stats.lines).toBe(2)
        expect(stats.letters).toBe(10)
        expect(stats.digits).toBe(3)
    })

    it("returns zeros for empty input", () => {
        const stats = getLetterCounterStats("")
        expect(stats).toEqual({
            characters: 0,
            charactersNoSpaces: 0,
            words: 0,
            lines: 0,
            letters: 0,
            digits: 0,
        })
    })

    it("formats summary text", () => {
        const summary = formatLetterCounterSummary({
            characters: 10,
            charactersNoSpaces: 8,
            words: 2,
            lines: 1,
            letters: 8,
            digits: 0,
        })
        expect(summary).toContain("Characters: 10")
        expect(summary).toContain("Words: 2")
    })
})
