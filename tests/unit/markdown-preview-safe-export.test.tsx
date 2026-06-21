import fs from "node:fs"
import path from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { MarkdownPreviewRenderer } from "@/features/tool-templates/markdown-preview-renderer"
import {
    buildMarkdownExportDocument,
    sanitizeMarkdownPreviewHtml,
} from "@/features/tools/markdown-preview/export"

const MALICIOUS_PREVIEW_HTML = `
<h1>Safe heading</h1>
<script>alert(1)</script>
<img src="x" onerror="alert(1)">
<img src="data:image/png;base64,abc" alt="inline">
<a href="javascript:alert(1)" onclick="alert(1)">bad link</a>
<svg onload="alert(1)"></svg>
<iframe src="https://example.com"></iframe>
`

function expectNoExecutableMarkup(output: string) {
    expect(output).not.toMatch(/<script/i)
    expect(output).not.toMatch(/\bon[a-z]+\s*=/i)
    expect(output).not.toMatch(/\b(?:href|src)\s*=\s*["']?\s*javascript:/i)
    expect(output).not.toMatch(/<svg/i)
    expect(output).not.toMatch(/<iframe/i)
}

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("Markdown Preview safe export", () => {
    it("sanitizes copied HTML fragments and exported HTML documents", () => {
        const sanitizedFragment = sanitizeMarkdownPreviewHtml(MALICIOUS_PREVIEW_HTML)
        expect(sanitizedFragment).toContain("Safe heading")
        expect(sanitizedFragment).not.toContain('src="x"')
        expect(sanitizedFragment).toContain('src="data:image/png;base64,abc"')
        expectNoExecutableMarkup(sanitizedFragment)

        const document = buildMarkdownExportDocument({
            lang: "en\" onload=\"alert(1)",
            title: `Markdown <Export> "Test"`,
            previewHtml: MALICIOUS_PREVIEW_HTML,
        })

        expect(document).toContain("<!DOCTYPE html>")
        expect(document).toContain("<html lang=\"enonloadalert1\">")
        expect(document).toContain("Markdown &lt;Export&gt; &quot;Test&quot;")
        expectNoExecutableMarkup(document)
    })

    it("renders common GFM output while preserving the sanitizer boundary", () => {
        render(
            <MarkdownPreviewRenderer
                markdown={`# Heading

| Name | Done |
| --- | --- |
| Build | yes |

- [x] Task

~~removed~~

\`\`\`js
console.log("ok")
\`\`\`

[Byteflow](https://byteflow.tools)
![Alt](https://byteflow.tools/og/default.png)
![Inline](data:image/png;base64,abc)

<img src=x onerror=alert(1)>
[bad](javascript:alert(1))
`}
            />,
        )

        const preview = screen.getByText("Heading").closest("#markdown-preview")
        expect(preview).toBeTruthy()
        const html = preview?.innerHTML ?? ""

        expect(html).toContain("<table>")
        expect(html).toContain('type="checkbox"')
        expect(html).toContain("<del>removed</del>")
        expect(html).toContain("console.log")
        expect(html).toContain('href="https://byteflow.tools"')
        expect(html).not.toContain('src="https://byteflow.tools/og/default.png"')
        expect(html).toContain("Image blocked: Alt")
        expect(html).toContain("Image blocked: Inline")
        expect(html).not.toContain('src="x"')
        expectNoExecutableMarkup(html)
        expect(html).not.toContain('href="javascript:')
    })

    it("keeps Markdown body out of persistence, analytics, logs, and handoff APIs", () => {
        const sources = [
            "src/features/tools/markdown-preview/page.tsx",
            "src/features/tools/markdown-preview/export.ts",
            "src/features/tool-templates/markdown-preview-renderer.tsx",
        ]

        const findings: string[] = []
        for (const file of sources) {
            const source = readSource(file)
            if (/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/.test(source)) findings.push(`${file}: storage`)
            if (/\btrackEvent\b|\btrackToolUsage\b|\banalytics\b/.test(source)) findings.push(`${file}: analytics`)
            if (/\bconsole\.(log|debug|info|warn|error)\b/.test(source)) findings.push(`${file}: console`)
            if (/\bbuildToolHandoffLink\b|\bbuildShareableToolHandoffHref\b/.test(source)) findings.push(`${file}: handoff`)
            if (/\bfetch\s*\(|\bnavigator\.sendBeacon\b/.test(source)) findings.push(`${file}: remote`)
        }

        expect(findings).toEqual([])
    })
})
