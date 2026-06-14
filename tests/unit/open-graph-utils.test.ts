import { describe, expect, it } from "vitest"
import {
    buildOpenGraphMetaTags,
    buildOpenGraphSnippetDocument,
    normalizeAbsoluteHttpUrl,
    type OpenGraphInput,
} from "@/features/tools/open-graph-meta-generator/utils"

describe("open-graph-utils", () => {
    const sample: OpenGraphInput = {
        title: "Byteflow Tools",
        description: "Local-first developer tools.",
        url: "https://byteflow.tools/en/open-graph-meta-generator",
        image: "https://byteflow.tools/og.png",
        type: "website",
        siteName: "byteflow.tools",
        twitterCard: "summary_large_image",
        twitterSite: "@byteflowtools",
    }

    it("normalizes absolute http urls", () => {
        expect(normalizeAbsoluteHttpUrl("https://example.com/a?b=1")).toContain("https://example.com")
        expect(normalizeAbsoluteHttpUrl("ftp://example.com")).toBeNull()
    })

    it("builds og + twitter meta tags", () => {
        const tags = buildOpenGraphMetaTags(sample)
        expect(tags).toContain('property="og:title"')
        expect(tags).toContain('name="twitter:card"')
        expect(tags).toContain("summary_large_image")
    })

    it("escapes dangerous characters", () => {
        const tags = buildOpenGraphMetaTags({
            ...sample,
            title: '<script>alert("x")</script>',
        })
        expect(tags).toContain("&lt;script&gt;")
        expect(tags).not.toContain("<script>")
    })

    it("wraps tags into a snippet document", () => {
        const doc = buildOpenGraphSnippetDocument("<meta property=\"og:title\" content=\"A\" />")
        expect(doc).toContain("Paste these tags")
        expect(doc).toContain("og:title")
    })
})
