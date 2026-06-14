import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("tool privacy footer placement", () => {
    it("renders from the locale layout instead of individual tool pages", () => {
        const layoutSource = readFileSync("src/app/[lang]/layout.tsx", "utf8")
        const jsonFormatterSource = readFileSync("src/features/tools/json-formatter/page.tsx", "utf8")

        expect(layoutSource).toContain("<ToolPrivacyFooterSlot />")
        expect(jsonFormatterSource).not.toContain("<ToolPrivacyFooter")
    })
})
