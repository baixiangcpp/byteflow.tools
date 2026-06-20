import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { sanitizeHtml, sanitizeSvg, sanitizeSvgForPreview } from "@/core/security/sanitize"
import { MarkdownPreviewRenderer } from "@/features/tool-templates/markdown-preview-renderer"
import { optimizeAndSanitizeSvg } from "@/features/tools/svg-optimizer/logic"
import { ensureSvgMarkup } from "@/features/tools/svg-to-png-converter/utils"
import { convertStrokeToFill } from "@/features/tools/svg-stroke-to-fill-converter/utils"

const MALICIOUS_HTML = `
<script>alert(1)</script>
<img src=x onerror=alert(1)>
<a href="javascript:alert(1)" onclick="alert(1)">click</a>
<iframe src="https://example.com"></iframe>
`

const MALICIOUS_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)">
  <script>alert(1)</script>
  <animate attributeName="x" from="0" to="10" dur="1s" onbegin="alert(1)" />
  <a href="javascript:alert(1)">
    <circle cx="5" cy="5" r="4" style="background:url(javascript:alert(1))" />
  </a>
  <image href="https://example.com/tracker.png" />
  <foreignObject><div onclick="alert(1)">x</div></foreignObject>
</svg>
`

function expectNoExecutableMarkup(output: string) {
    expect(output).not.toMatch(/<script/i)
    expect(output).not.toMatch(/\bon[a-z]+\s*=/i)
    expect(output).not.toMatch(/javascript:/i)
    expect(output).not.toMatch(/<iframe/i)
    expect(output).not.toMatch(/<foreignObject/i)
}

describe("XSS hardening", () => {
    it("sanitizes Markdown raw HTML before rendering in the preview DOM", () => {
        render(
            <MarkdownPreviewRenderer
                markdown={`# Preview\n\n${MALICIOUS_HTML}\n\n[bad](javascript:alert(1))`}
            />,
        )

        const preview = screen.getByText("Preview").closest("#markdown-preview")
        expect(preview).toBeTruthy()
        const html = preview?.innerHTML ?? ""
        expect(html).toContain("Preview")
        expectNoExecutableMarkup(html)
        expect(html).not.toContain("href")
    })

    it("sanitizes copied and exported HTML fragments with the shared sanitizer", () => {
        const output = sanitizeHtml(MALICIOUS_HTML)
        expect(output).toContain("<img")
        expect(output).toContain("<a")
        expectNoExecutableMarkup(output)
    })

    it("sanitizes SVG optimizer preview output", () => {
        const output = optimizeAndSanitizeSvg(MALICIOUS_SVG)
        expect(output).toContain("<svg")
        expect(output).toContain("<circle")
        expectNoExecutableMarkup(output)
        expect(output).not.toMatch(/<animate/i)
        expect(output).not.toMatch(/<image/i)
        expect(output).not.toMatch(/\bstyle\s*=/i)
    })

    it("sanitizes SVG before raster preview or PNG conversion", () => {
        const output = ensureSvgMarkup(MALICIOUS_SVG)
        expect(output).toContain("<svg")
        expectNoExecutableMarkup(output)
        expect(output).not.toMatch(/<animate/i)
        expect(output).not.toMatch(/<image/i)
    })

    it("sanitizes SVG stroke-to-fill input and output", () => {
        const result = convertStrokeToFill(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onload="alert(1)">
              <script>alert(1)</script>
              <line x1="0" y1="10" x2="20" y2="10" stroke="#000" stroke-width="2" onclick="alert(1)" />
            </svg>
        `)

        expect(result.error).toBeUndefined()
        expect(result.svg).toContain("<polygon")
        expectNoExecutableMarkup(result.svg)
    })

    it("rejects SVG payloads that sanitize down to no SVG root", () => {
        expect(() => sanitizeSvgForPreview(`<script>alert(1)</script>`)).toThrow(/safe <svg>/)
    })

    it("keeps the SVG sanitizer shared between security-sensitive SVG tools", () => {
        expect(sanitizeSvg(MALICIOUS_SVG)).toBe(ensureSvgMarkup(MALICIOUS_SVG))
    })
})
