/**
 * Tests for invisible-chars-utils
 */

import { describe, it, expect } from "vitest"
import { analyzeText, cleanText, formatCodePoint, getCategoryLabel } from "../../src/lib/invisible-chars-utils"

describe("analyzeText", () => {
    it("should detect zero-width space", () => {
        const text = "Hello​World" // Contains U+200B (ZWSP)
        const result = analyzeText(text)

        expect(result.totalChars).toBe(11)
        expect(result.suspiciousChars).toHaveLength(1)
        expect(result.suspiciousChars[0].codePoint).toBe(0x200b)
        expect(result.suspiciousChars[0].category).toBe("zero-width")
        expect(result.suspiciousChars[0].displayName).toBe("Zero Width Space")
    })

    it("should detect non-breaking space", () => {
        const text = "Hello World"
        const result = analyzeText(text)

        expect(result.suspiciousChars).toHaveLength(1)
        expect(result.suspiciousChars[0].codePoint).toBe(0x00a0)
        expect(result.suspiciousChars[0].category).toBe("whitespace-non-standard")
    })

    it("should track line and column correctly", () => {
        const text = "Line1\nLine​2"
        const result = analyzeText(text)

        expect(result.totalLines).toBe(2)
        const zwsp = result.suspiciousChars.find((c) => c.codePoint === 0x200b)
        expect(zwsp?.line).toBe(2)
        expect(zwsp?.column).toBe(5)
    })

    it("should detect multiple suspicious chars", () => {
        const text = "A​B C‍D" // ZWSP, NBSP, ZWJ
        const result = analyzeText(text)

        expect(result.suspiciousChars).toHaveLength(3)
        expect(result.suspiciousChars.map((c) => c.codePoint)).toEqual([0x200b, 0x00a0, 0x200d])
    })

    it("should detect zero-width non-joiner", () => {
        const text = `A${String.fromCodePoint(0x200c)}B`
        const result = analyzeText(text)

        expect(result.suspiciousChars).toHaveLength(1)
        expect(result.suspiciousChars[0].codePoint).toBe(0x200c)
        expect(result.suspiciousChars[0].displayName).toBe("Zero Width Non-Joiner")
    })

    it("should detect byte order mark", () => {
        const text = `${String.fromCodePoint(0xfeff)}Hello`
        const result = analyzeText(text)

        expect(result.suspiciousChars).toHaveLength(1)
        expect(result.suspiciousChars[0].category).toBe("bom")
        expect(result.suspiciousChars[0].codePoint).toBe(0xfeff)
    })

    it("should detect full-width space", () => {
        const text = `Hello${String.fromCodePoint(0x3000)}World`
        const result = analyzeText(text)

        expect(result.suspiciousChars).toHaveLength(1)
        expect(result.suspiciousChars[0].category).toBe("whitespace-non-standard")
        expect(result.suspiciousChars[0].codePoint).toBe(0x3000)
    })

    it("should detect tab characters", () => {
        const result = analyzeText("Hello\tWorld")

        expect(result.suspiciousChars).toHaveLength(1)
        expect(result.suspiciousChars[0].category).toBe("tab")
        expect(result.suspiciousChars[0].codePoint).toBe(0x09)
    })

    it("should handle CRLF correctly", () => {
        const text = "Line1\r\nLine2"
        const result = analyzeText(text)

        expect(result.totalLines).toBe(2)
        const suspiciousChars = result.suspiciousChars.filter((c) => c.category === "line-ending")
        expect(suspiciousChars).toHaveLength(2) // CR and LF are both detected
    })

    it("should detect C0 control characters", () => {
        const text = "Hello\x00World" // NULL character
        const result = analyzeText(text)

        const nullChar = result.suspiciousChars.find((c) => c.codePoint === 0x00)
        expect(nullChar).toBeDefined()
        expect(nullChar?.category).toBe("control")
    })

    it("should detect C1 control characters", () => {
        const text = `Hello${String.fromCodePoint(0x85)}World`
        const result = analyzeText(text)

        const controlChar = result.suspiciousChars.find((c) => c.codePoint === 0x85)
        expect(controlChar).toBeDefined()
        expect(controlChar?.category).toBe("control")
    })

    it("should handle emojis correctly (multi-codepoint)", () => {
        const text = "A👍B" // Emoji takes 2 code units but 1 code point
        const result = analyzeText(text)

        expect(result.totalChars).toBe(3) // A, emoji, B
        expect(result.suspiciousChars).toHaveLength(0)
    })

    it("should return empty for clean text", () => {
        const text = "Hello World Line 2"
        const result = analyzeText(text)

        expect(result.suspiciousChars).toHaveLength(0) // No suspicious characters in clean text
    })
})

describe("cleanText", () => {
    it("should remove zero-width characters", () => {
        const text = "Hello​World‌Test‍End"
        const cleaned = cleanText(text, {
            removeZeroWidth: true,
            normalizeSpaces: false,
            removeControlExceptNewlineTab: false,
        })

        expect(cleaned).toBe("HelloWorldTestEnd")
    })

    it("should normalize non-standard spaces", () => {
        const text = "Hello World　Test"
        const cleaned = cleanText(text, {
            removeZeroWidth: false,
            normalizeSpaces: true,
            removeControlExceptNewlineTab: false,
        })

        expect(cleaned).toBe("Hello World Test")
    })

    it("should remove control characters except newline and tab", () => {
        const text = "Hello\x00World\nKeep\tNewline"
        const cleaned = cleanText(text, {
            removeZeroWidth: false,
            normalizeSpaces: false,
            removeControlExceptNewlineTab: true,
        })

        expect(cleaned).toBe("HelloWorld\nKeep\tNewline")
    })

    it("should apply all options together", () => {
        const text = "A​B C\x00D\nE"
        const cleaned = cleanText(text, {
            removeZeroWidth: true,
            normalizeSpaces: true,
            removeControlExceptNewlineTab: true,
        })

        expect(cleaned).toBe("AB CD\nE")
    })

    it("should keep regular text unchanged", () => {
        const text = "Hello World\nNew Line"
        const cleaned = cleanText(text, {
            removeZeroWidth: true,
            normalizeSpaces: true,
            removeControlExceptNewlineTab: true,
        })

        expect(cleaned).toBe(text)
    })
})

describe("formatCodePoint", () => {
    it("should format code points correctly", () => {
        expect(formatCodePoint(0x200b)).toBe("U+200B")
        expect(formatCodePoint(0x00a0)).toBe("U+00A0")
        expect(formatCodePoint(0x3000)).toBe("U+3000")
        expect(formatCodePoint(0x09)).toBe("U+0009")
    })
})

describe("getCategoryLabel", () => {
    it("should return correct labels", () => {
        expect(getCategoryLabel("zero-width")).toBe("Zero-Width")
        expect(getCategoryLabel("control")).toBe("Control Character")
        expect(getCategoryLabel("whitespace-non-standard")).toBe("Non-Standard Whitespace")
        expect(getCategoryLabel("bom")).toBe("Byte Order Mark")
        expect(getCategoryLabel("line-ending")).toBe("Line Ending")
        expect(getCategoryLabel("tab")).toBe("Tab")
    })
})
