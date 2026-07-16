import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const PROJECT_ROOT = process.cwd()

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8")
}

describe("BF-016 accessibility and mobile baseline", () => {
    it("keeps the skip link visible on focus and moves focus to main content", () => {
        const source = readSource("src/components/layout/app-layout.tsx")

        expect(source).toContain('data-skip-link="main-content"')
        expect(source).toContain('id="main-content"')
        expect(source).toContain("tabIndex={-1}")
        expect(source).toContain('document.getElementById("main-content")')
        expect(source).toContain("main.focus")
    })

    it("keeps toast feedback exposed through a polite live region", () => {
        const source = readSource("src/components/ui/sonner.tsx")
        const testSource = readSource("tests/component/toaster-live-region.test.tsx")

        expect(source).toContain("Toaster as Sonner")
        expect(source).not.toContain("data-toast-live-region")
        expect(testSource).toContain('section[aria-live="polite"]')
        expect(testSource).toContain("announces the latest toast title and description")
    })

    it("keeps coarse-pointer controls at the WCAG target-size baseline", () => {
        const source = readSource("src/app/globals.css")

        expect(source).toContain("@media (max-width: 767px), (pointer: coarse)")
        expect(source).toContain("min-height: 44px !important")
        expect(source).toContain("min-width: 44px !important")
        expect(source).not.toContain("focus-visible:ring-0")
    })

    it("keeps Playwright smoke sampling keyboard, All Tools, JSON, JWT, and Markdown Preview paths", () => {
        const source = readSource("scripts/e2e/run-playwright-smoke.js")

        expect(source).toContain("assertSkipLinkKeyboardPath")
        expect(source).toContain("assertMobileTouchTargets")
        expect(source).toContain('route: "/en/all-tools"')
        expect(source).toContain('route: "/en/json-formatter"')
        expect(source).toContain('route: "/en/jwt-decoder"')
        expect(source).toContain('route: "/en/markdown-preview"')
        expect(source).toContain("copy:\\s*(header|payload)")
    })

    it("keeps All Tools filters large enough for mobile touch", () => {
        const source = readSource("src/features/tool-discovery/all-tools-discovery.tsx")

        expect(source).toContain('"min-h-11 min-w-11 rounded-md border px-2.5 py-1')
        expect(source).toContain('className="min-h-11 pl-9"')
        expect(source).toContain("inline-flex min-h-11 items-center")
        expect(source).not.toContain('"min-h-9 rounded-md border px-2.5 py-1')
        expect(source).not.toContain("inline-flex min-h-8 items-center gap-1")
    })

    it("keeps Markdown Preview mobile layout stacked before desktop split", () => {
        const source = readSource("src/features/tools/markdown-preview/page.tsx")

        expect(source).toContain("lg:flex-row")
        expect(source).toContain("lg:w-1/2")
        expect(source).toContain('id="markdown-source-editor"')
        expect(source).toContain('role="status"')
    })
})
