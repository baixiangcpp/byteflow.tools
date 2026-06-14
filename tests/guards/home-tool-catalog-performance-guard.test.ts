import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

describe("home tool catalog performance guard", () => {
    it("uses the lightweight category preview on homepage instead of full catalog", () => {
        const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/[lang]/page.tsx"), "utf8")
        const previewSource = fs.readFileSync(path.join(process.cwd(), "src/features/home/components/home-category-preview.tsx"), "utf8")

        // Homepage should use HomeCategoryPreview, not DeferredHomeToolCatalog
        expect(pageSource).toContain('import { HomeCategoryPreview } from "@/features/home/components/home-category-preview"')
        expect(pageSource).not.toContain('import { DeferredHomeToolCatalog }')
        expect(pageSource).toContain("<HomeCategoryPreview")
        expect(pageSource).not.toContain("<DeferredHomeToolCatalog")

        // HomeCategoryPreview should limit tools shown
        expect(previewSource).toContain('PREVIEW_TOOL_LIMIT')
        expect(previewSource).toContain('.slice(0, PREVIEW_TOOL_LIMIT)')
        expect(previewSource).not.toContain('IntersectionObserver')
        expect(previewSource).not.toContain('dynamic(')
    })
})
