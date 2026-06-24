import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { sanitizeHtml, sanitizeMarkdownHtml, sanitizeSvgForPreview } from "@/core/security/sanitize"
import { MarkdownPreviewRenderer } from "@/features/tool-templates/markdown-preview-renderer"
import { convertHtmlToMarkdown } from "@/features/tools/html-to-markdown/utils"
import { optimizeAndSanitizeSvg } from "@/features/tools/svg-optimizer/logic"
import { buildOpenGraphMetaTags, buildOpenGraphSnippetDocument } from "@/features/tools/open-graph-meta-generator/utils"

const UNSAFE_MARKUP = `
<h1 onclick="alert(1)">Safe title</h1>
<script>alert(1)</script>
<iframe src="https://evil.example"></iframe>
<img src="https://evil.example/pixel.png" onerror="alert(1)">
<a href="javascript:alert(1)">bad</a>
<svg onload="alert(1)"><script>alert(1)</script><image href="https://evil.example/x.png" /></svg>
`

function expectNoExecutableMarkup(output: string) {
    expect(output).not.toMatch(/<script/i)
    expect(output).not.toMatch(/<iframe/i)
    expect(output).not.toMatch(/\bon[a-z]+\s*=/i)
    expect(output).not.toMatch(/\b(?:href|src|xlink:href)\s*=\s*["']?\s*javascript:/i)
    expect(output).not.toMatch(/evil\.example/i)
}

describe("preview sanitization regression suite", () => {
    it("sanitizes Markdown preview and export HTML", () => {
        const sanitized = sanitizeMarkdownHtml(UNSAFE_MARKUP)
        expect(sanitized).toContain("Safe title")
        expectNoExecutableMarkup(sanitized)

        render(
            <MarkdownPreviewRenderer markdown={`# Safe\n\n${UNSAFE_MARKUP}\n\n![remote](https://evil.example/pixel.png)`} />,
        )
        const html = screen.getByText("Safe").closest("#markdown-preview")?.innerHTML ?? ""

        expect(html).toContain("Safe")
        expect(html).toContain("Image blocked: remote")
        expectNoExecutableMarkup(html)
    })

    it("sanitizes HTML before HTML-to-Markdown conversion", () => {
        const sanitized = sanitizeHtml(UNSAFE_MARKUP)
        const markdown = convertHtmlToMarkdown(UNSAFE_MARKUP)

        expect(sanitized).toContain("Safe title")
        expectNoExecutableMarkup(sanitized)
        expect(markdown).toContain("Safe title")
        expect(markdown).not.toContain("alert(1)")
        expect(markdown).not.toContain("evil.example")
    })

    it("sanitizes SVG preview and optimizer output", () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script><image href="https://evil.example/x.png" /><circle cx="5" cy="5" r="4" /></svg>`
        const preview = sanitizeSvgForPreview(svg)
        const optimized = optimizeAndSanitizeSvg(svg)

        expect(preview).toContain("<svg")
        expect(preview).toContain("<circle")
        expect(optimized).toContain("<circle")
        expectNoExecutableMarkup(preview)
        expectNoExecutableMarkup(optimized)
        expect(preview).not.toMatch(/<image/i)
        expect(optimized).not.toMatch(/<image/i)
    })

    it("escapes Open Graph preview metadata and blocks unsafe preview URLs", () => {
        const tags = buildOpenGraphMetaTags({
            title: `"><script>alert(1)</script>`,
            description: `<img src=x onerror=alert(1)>`,
            url: "javascript:alert(1)",
            image: "https://evil.example/og.png",
            type: "website",
            siteName: "byteflow.tools",
            twitterCard: "summary_large_image",
            twitterSite: "@byteflow",
        })
        const document = buildOpenGraphSnippetDocument(tags)

        expect(document).toContain("&lt;script&gt;alert(1)&lt;/script&gt;")
        expect(document).toContain("&lt;img src=x onerror=alert(1)&gt;")
        expect(document).not.toContain("javascript:alert(1)")
        expect(document).not.toContain("<script>")
        expect(document).not.toContain("<img")
    })
})
