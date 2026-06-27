import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

function read(path: string) {
    return readFileSync(path, "utf8")
}

describe("issues #262/#263 mobile and accessibility audit coverage", () => {
    it("keeps the browser smoke wired to a representative mobile no-overflow matrix", () => {
        const smoke = read("scripts/e2e/run-playwright-smoke.js")

        expect(smoke).toContain("MOBILE_REVIEW_VIEWPORTS")
        expect(smoke).toContain("{ width: 360, height: 740 }")
        expect(smoke).toContain("{ width: 768, height: 1024 }")
        expect(smoke).toContain("MOBILE_REVIEW_ROUTES")
        expect(smoke).toContain('"/en"')
        expect(smoke).toContain('"/en/all-tools"')
        expect(smoke).toContain('"/en/data-code-formats"')
        expect(smoke).toContain('"/en/json-formatter"')
        expect(smoke).toContain('"/en/pipeline-builder"')
        expect(smoke).toContain('"/en/trust-center"')
        expect(smoke).toContain('"/en/install-app"')
        expect(smoke).toContain("assertMobileReviewMatrix")
        expect(smoke).toContain("assertNoHorizontalOverflow")
        expect(smoke).toContain("assertMobileTouchTargets")
    })

    it("keeps browser-level axe serious and critical coverage for representative pages", () => {
        const smoke = read("scripts/e2e/run-playwright-smoke.js")

        expect(smoke).toContain("import axe from \"axe-core\"")
        expect(smoke).toContain("AXE_REVIEW_ROUTES")
        expect(smoke).toContain("assertAxeSeriousCriticalMatrix")
        expect(smoke).toContain("violation.impact === \"serious\" || violation.impact === \"critical\"")
        expect(smoke).toContain("Axe serious/critical violations")
    })

    it("keeps Pipeline Builder mobile diagnostics readable without forcing page overflow", () => {
        const runLog = read("src/features/tools/pipeline-builder/pipeline-run-log.tsx")
        const stepList = read("src/features/tools/pipeline-builder/pipeline-step-list.tsx")

        expect(runLog).toContain("sm:hidden")
        expect(runLog).toContain("hidden overflow-x-auto sm:block")
        expect(runLog).toContain("min-w-[42rem]")
        expect(stepList).toContain("min-h-11 min-w-11")
    })

    it("keeps the audit matrix documented with automated and manual boundaries", () => {
        const doc = read("docs/accessibility/audit-25-26-mobile-a11y-matrix.md")

        expect(doc).toContain("360x740")
        expect(doc).toContain("/en/pipeline-builder")
        expect(doc).toContain("Axe serious and critical violations must be zero")
        expect(doc).toContain("Android Chrome PWA install")
        expect(doc).toContain("iOS Safari Add to Home Screen")
        expect(doc).toContain("Screen-reader output")
    })
})
