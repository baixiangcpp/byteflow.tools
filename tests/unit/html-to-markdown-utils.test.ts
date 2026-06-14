import { describe, expect, it } from "vitest"
import { convertHtmlToMarkdown } from "@/features/tools/html-to-markdown/utils"

describe("html-to-markdown utils", () => {
    it("converts headings and paragraphs", () => {
        const html = "<h1>Title</h1><p>Hello world.</p>"
        expect(convertHtmlToMarkdown(html)).toBe("# Title\n\nHello world.")
    })

    it("converts links and formatting", () => {
        const html = "<p><strong>Docs</strong> at <a href=\"https://byteflow.tools\">byteflow</a>.</p>"
        expect(convertHtmlToMarkdown(html)).toBe("**Docs** at [byteflow](https://byteflow.tools).")
    })

    it("converts code blocks", () => {
        const html = "<pre><code>const a = 1;</code></pre>"
        expect(convertHtmlToMarkdown(html)).toBe("```\nconst a = 1;\n```")
    })
})
