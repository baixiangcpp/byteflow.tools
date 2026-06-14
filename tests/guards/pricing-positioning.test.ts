import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { LOCALES } from "@/core/i18n/i18n"

const PRICING_SOURCE = readFileSync("src/app/[lang]/pricing/page.tsx", "utf8")
const FORBIDDEN_PRICING_PROMISES = [
    "$9",
    "Pro/API",
    "synced history",
    "shared workspaces",
    "priority support",
    "API access",
    "premium upgrade",
] as const

describe("pricing positioning", () => {
    it("keeps the pricing page aligned with the free local-first product boundary", () => {
        for (const locale of LOCALES) {
            const copy = Object.entries(getTranslation(locale).pages)
                .filter(([key]) => key.startsWith("pricing_"))
                .map(([, value]) => String(value))
                .join("\n")

            expect(copy).toMatch(/free|gratuit|무료|免費|免费|無料|kostenlos/i)

            for (const forbidden of FORBIDDEN_PRICING_PROMISES) {
                expect(copy).not.toContain(forbidden)
            }
        }
    })

    it("does not route pricing CTAs to contact or account-backed plan flows", () => {
        expect(PRICING_SOURCE).toContain("/all-tools")
        expect(PRICING_SOURCE).toContain("https://github.com/baixiangcpp/byteflow.tools")
        expect(PRICING_SOURCE).not.toContain("/contact")
    })
})
