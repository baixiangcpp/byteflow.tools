import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function read(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("BF-036/BF-038 accessibility and visual QA guard", () => {
    it("keeps the manual keyboard and visual QA checklist documented", () => {
        const doc = read("docs/accessibility/bf-036-bf-038-keyboard-visual-qa.md")

        expect(doc).toContain("Command palette")
        expect(doc).toContain("mobile filters")
        expect(doc).toContain("Disabled actions")
        expect(doc).toContain("Long text and mobile")
        expect(doc).toContain("Touch targets")
        expect(doc).toContain("Theme contrast")
        expect(doc).toContain("390px")
    })

    it("keeps browser smoke coverage for keyboard, focus, mobile, copy feedback, and overflow", () => {
        const smoke = read("scripts/e2e/run-playwright-smoke.js")
        const mobileNav = read("src/components/layout/deferred-mobile-nav-menu.tsx")

        expect(smoke).toContain("assertCommandPaletteJourney")
        expect(smoke).toContain("assertMobileCommandPaletteJourney")
        expect(smoke).toContain("assertSkipLinkKeyboardPath")
        expect(smoke).toContain("assertHeaderKeyboardPaths")
        expect(smoke).toContain("assertMobileNavigationKeyboardPath")
        expect(smoke).toContain("assertMobileToolPageJourneys")
        expect(smoke).toContain("assertMobileTouchTargets")
        expect(smoke).toContain("assertNoHorizontalOverflow")
        expect(smoke).toContain("clickCopyAndExpectToast")
        expect(smoke).toContain("mobile json formatter long output")
        expect(smoke).toContain("mobile base64 long URL output")
        expect(smoke).toContain('route: "/en/image-resizer"')
        expect(smoke).toContain('{ width: 390, height: 844 }')
        expect(mobileNav).toContain("triggerRef")
        expect(mobileNav).toContain("triggerRef.current?.focus()")
        expect(mobileNav).toContain("aria-expanded")
    })

    it("keeps disabled reasons, long-text containment, and contrast token regression coverage wired", () => {
        const actionBar = read("src/features/tool-shell/tool-action-bar.tsx")
        const allToolsGuard = read("tests/guards/all-tools-performance-a11y-guard.test.ts")
        const contrastGuard = read("tests/guards/theme-contrast-token-guard.test.ts")

        expect(actionBar).toContain("aria-describedby={disabledDescriptionId}")
        expect(actionBar).toContain("disabled:pointer-events-none disabled:opacity-50")
        expect(actionBar).toContain("min-h-11")
        expect(allToolsGuard).toContain("break-words")
        expect(allToolsGuard).toContain("overflow-hidden")
        expect(allToolsGuard).toContain("min-height: 44px !important")
        expect(contrastGuard).toContain("toBeGreaterThanOrEqual(4.5)")
        expect(contrastGuard).toContain('":root"')
        expect(contrastGuard).toContain('".dark"')
    })
})
