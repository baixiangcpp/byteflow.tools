import { describe, expect, it } from "vitest"
import { extractVisibleTextSegments, includesPhrase } from "../../scripts/gates/check-rendered-i18n-copy.js"

describe("check-rendered-i18n-copy segmentation", () => {
    it("does not match phrase stitched across separate controls", () => {
        const html = `
            <div>
                <button>Open HTML Formatter</button>
                <button>Minify</button>
            </div>
        `
        const segments = extractVisibleTextSegments(html)
        expect(includesPhrase(segments, "HTML Minifier")).toBe(false)
    })

    it("still matches phrase rendered in one visible heading", () => {
        const html = `<h1><span>HTML</span> Minifier</h1>`
        const segments = extractVisibleTextSegments(html)
        expect(includesPhrase(segments, "HTML Minifier")).toBe(true)
    })
})
