import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("markdown preview source guard", () => {
    it("keeps heavy markdown rendering libraries behind the dedicated lazy renderer", () => {
        const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/markdown-preview/page.tsx"), "utf8")
        const rendererSource = fs.readFileSync(path.join(process.cwd(), "src/features/tool-templates/markdown-preview-renderer.tsx"), "utf8")

        expect(pageSource).not.toContain('from "react-markdown"')
        expect(pageSource).not.toContain('from "remark-gfm"')
        expect(pageSource).not.toContain('from "rehype-raw"')
        expect(pageSource).not.toContain('from "rehype-sanitize"')

        expect(rendererSource).toContain('from "react-markdown"')
        expect(rendererSource).toContain('from "remark-gfm"')
        expect(rendererSource).toContain('from "rehype-raw"')
        expect(rendererSource).toContain('from "rehype-sanitize"')
    })
})
