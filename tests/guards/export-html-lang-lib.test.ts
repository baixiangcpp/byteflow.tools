import { describe, expect, it } from "vitest"
import {
    extractHtmlLang,
    resolveExpectedHtmlLang,
    rewriteHtmlLang,
} from "../../scripts/lib/export-html-lang-lib.js"

const LOCALES = ["de", "en", "fr", "ja", "ko", "zh-CN", "zh-TW"]

describe("export html lang helpers", () => {
    it("resolves locale pages from exported html paths", () => {
        expect(resolveExpectedHtmlLang("ja.html", LOCALES)).toBe("ja")
        expect(resolveExpectedHtmlLang("zh-CN/about.html", LOCALES)).toBe("zh-CN")
        expect(resolveExpectedHtmlLang("fr/json-formatter.html", LOCALES)).toBe("fr")
    })

    it("defaults non-locale html routes to english", () => {
        expect(resolveExpectedHtmlLang("index.html", LOCALES)).toBe("en")
        expect(resolveExpectedHtmlLang("404.html", LOCALES)).toBe("en")
        expect(resolveExpectedHtmlLang("_not-found.html", LOCALES)).toBe("en")
    })

    it("rewrites the root html lang attribute without disturbing other attributes", () => {
        const html = '<html lang="en" suppressHydrationWarning><head></head><body></body></html>'
        const rewritten = rewriteHtmlLang(html, "zh-TW")

        expect(extractHtmlLang(rewritten)).toBe("zh-TW")
        expect(rewritten).toContain("suppressHydrationWarning")
    })
})
