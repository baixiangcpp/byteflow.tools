import { describe, expect, it } from "vitest"
import { analyzeSerpPreview, generateLlmsTxtDraft, validateHreflang, validateSitemapUrls } from "./logic"

describe("seo-metadata-workbench logic", () => {
    it("warns about long SERP metadata", () => {
        const report = analyzeSerpPreview({ title: "x".repeat(70), description: "short", url: "https://example.com" })
        expect(report.warnings).toContain("Title is longer than 60 characters and may truncate.")
    })

    it("validates hreflang duplicates and x-default", () => {
        const report = validateHreflang([{ lang: "en", url: "https://example.com" }, { lang: "en", url: "bad" }])
        expect(report.warnings.some((warning) => warning.includes("Duplicate"))).toBe(true)
        expect(report.warnings.some((warning) => warning.includes("x-default"))).toBe(true)
    })

    it("flags parameterized sitemap URLs", () => {
        expect(validateSitemapUrls(["https://example.com/page?q=1"]).warnings[0]).toContain("query")
    })

    it("generates privacy-safe llms.txt draft", () => {
        expect(generateLlmsTxtDraft({ name: "byteflow.tools", summary: "Local tools", tools: ["JSON", "JWT", "Base64"] }).content).toContain("No server-side tool payload processing")
    })
})
