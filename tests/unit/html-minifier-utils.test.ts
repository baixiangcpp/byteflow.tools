import { describe, expect, it } from "vitest"
import { minifyHtml } from "@/features/tools/html-minifier/utils"

describe("minifyHtml", () => {
    it("removes comments and collapses inter-tag whitespace", () => {
        const input = [
            "<!-- header -->",
            "<div>",
            "  <h1>Title</h1>",
            "  <p>Hello world</p>",
            "</div>",
        ].join("\n")

        const output = minifyHtml(input)

        expect(output).toBe("<div><h1>Title</h1><p>Hello world</p></div>")
    })

    it("returns empty string for blank input", () => {
        expect(minifyHtml("   \n\t")).toBe("")
    })

    it("keeps inline text content", () => {
        const output = minifyHtml("<p>ByteFlow Tools</p>")
        expect(output).toBe("<p>ByteFlow Tools</p>")
    })
})
