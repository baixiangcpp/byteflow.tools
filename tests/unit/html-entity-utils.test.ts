import { describe, expect, it } from "vitest"
import { decodeHtmlEntities, encodeHtmlEntities } from "@/features/tools/html-encoder-decoder/utils"

describe("html entity utils", () => {
    it("encodes html-sensitive characters", () => {
        const input = "<div class=\"x\">Tom & Jerry's</div>"
        const encoded = encodeHtmlEntities(input)

        expect(encoded).toContain("&lt;div")
        expect(encoded).toContain("&amp;")
        expect(encoded).toContain("&#39;")
    })

    it("decodes named and numeric entities", () => {
        const input = "&lt;span&gt;A&amp;B &#39;x&#39; &#x60;y&#x60;&lt;/span&gt;"
        const decoded = decodeHtmlEntities(input)

        expect(decoded).toBe("<span>A&B 'x' `y`</span>")
    })

    it("keeps unknown entities unchanged", () => {
        expect(decodeHtmlEntities("&notanentity; &lt;ok&gt;")).toBe("&notanentity; <ok>")
    })
})
