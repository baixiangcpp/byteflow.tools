import { describe, expect, it } from "vitest"
import {
    clampLoremCount,
    formatParagraphOutput,
    splitPlainParagraphs,
} from "@/features/tools/lorem-ipsum/utils"

describe("lorem-ipsum-utils", () => {
    it("clamps count to supported range", () => {
        expect(clampLoremCount(-5)).toBe(1)
        expect(clampLoremCount(5.9)).toBe(5)
        expect(clampLoremCount(5000)).toBe(1000)
    })

    it("splits plain text into clean paragraphs", () => {
        const paragraphs = splitPlainParagraphs("first\n\nsecond\n third ")
        expect(paragraphs).toEqual(["first", "second", "third"])
    })

    it("formats paragraph output for plain and html", () => {
        const paragraphs = ["one", "two"]
        expect(formatParagraphOutput(paragraphs, "plain")).toBe("one\n\ntwo")
        expect(formatParagraphOutput(paragraphs, "html")).toBe("<p>one</p>\n<p>two</p>")
    })
})
