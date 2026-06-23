import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("BF-005 mobile layout guards", () => {
    it("keeps the shared tool action bar touch-sized and wrappable on narrow screens", () => {
        const source = readFileSync("src/features/tool-shell/tool-action-bar.tsx", "utf8")

        expect(source).toContain("min-h-11")
        expect(source).toContain("flex w-full flex-wrap")
        expect(source).toContain("max-w-full")
    })

    it("keeps page-level horizontal overflow clipped while preserving mobile touch targets", () => {
        const source = readFileSync("src/app/globals.css", "utf8")

        expect(source).toContain("overflow-x: clip")
        expect(source).toContain("min-height: 44px")
    })

    it("keeps dense core tool layouts min-width constrained for 390px screens", () => {
        const files = [
            "src/features/tools/json-formatter/page.tsx",
            "src/features/tools/regex-tester/page.tsx",
            "src/features/tools/image-resizer/page.tsx",
            "src/features/tools/json-diff-viewer/page.tsx",
            "src/features/tools/text-diff-checker/page.tsx",
            "src/features/tool-discovery/all-tools-discovery.tsx",
        ]

        for (const file of files) {
            expect(readFileSync(file, "utf8"), file).toContain("min-w-0")
        }
    })
})
