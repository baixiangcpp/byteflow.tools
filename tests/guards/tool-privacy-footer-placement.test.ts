import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("tool privacy footer placement", () => {
    it("renders shared privacy surfaces instead of individual tool pages", () => {
        const layoutSource = readFileSync("src/app/[lang]/layout.tsx", "utf8")
        const routeChromeSource = readFileSync("src/components/layout/route-page-chrome.tsx", "utf8")
        const jsonFormatterSource = readFileSync("src/features/tools/json-formatter/page.tsx", "utf8")
        const urlEncodeSource = readFileSync("src/features/tools/url-encode-decode/page.tsx", "utf8")

        expect(layoutSource).toContain("<ToolPrivacyFooterSlot />")
        expect(routeChromeSource).toContain("<ToolTrustHeader")
        expect(jsonFormatterSource).not.toContain("<ToolPrivacyFooter")
        expect(jsonFormatterSource).not.toContain("<ToolTrustHeader")
        expect(urlEncodeSource).not.toContain("<ToolPrivacyFooter")
        expect(urlEncodeSource).not.toContain("<ToolTrustHeader")
    })
})
