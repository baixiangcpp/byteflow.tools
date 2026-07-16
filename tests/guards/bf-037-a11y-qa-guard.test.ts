import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8")
}

describe("BF-037 accessibility QA guard", () => {
    it("keeps axe coverage for representative dynamic tool interfaces", () => {
        const source = readSource("tests/component/representative-a11y-axe.test.tsx")
        const toastSource = readSource("tests/component/toaster-live-region.test.tsx")

        expect(source).toContain("axe.run")
        expect(source).toContain("<JsonFormatterPage />")
        expect(source).toContain("<PipelineBuilderPage />")
        expect(source).toContain("<YouTubeThumbnailGrabberPage />")
        expect(source).toContain("<AllToolsDiscovery")
        expect(toastSource).toContain("toast.success")
        expect(toastSource).toContain('section[aria-live="polite"]')
        expect(toastSource).toContain("data-toast-live-region")
    })

    it("keeps the manual screen-reader QA checklist documented", () => {
        const source = readSource("docs/accessibility/bf-037-screen-reader-qa.md")

        expect(source).toContain("JSON Formatter")
        expect(source).toContain("All Tools")
        expect(source).toContain("Pipeline Builder")
        expect(source).toContain("External-request media flow")
        expect(source).toContain("aria-describedby")
        expect(source).toContain("axe-core")
    })
})
