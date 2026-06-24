import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("preview sanitization guard", () => {
    it("keeps Markdown, HTML, SVG, and Open Graph preview paths covered by regression tests", () => {
        const test = read("tests/unit/preview-sanitization-regression.test.tsx")
        const sanitizer = read("src/core/security/sanitize.ts")
        const htmlToMarkdown = read("src/features/tools/html-to-markdown/utils.ts")
        const svgOptimizer = read("src/features/tools/svg-optimizer/logic.ts")
        const ogUtils = read("src/features/tools/open-graph-meta-generator/utils.ts")

        expect(test).toContain("MarkdownPreviewRenderer")
        expect(test).toContain("convertHtmlToMarkdown")
        expect(test).toContain("sanitizeSvgForPreview")
        expect(test).toContain("buildOpenGraphMetaTags")
        expect(sanitizer).toContain("FORBID_TAGS")
        expect(htmlToMarkdown).toContain("sanitizeHtml(normalized)")
        expect(svgOptimizer).toContain("sanitizeSvg")
        expect(ogUtils).toContain("escapeHtml")
    })
})
