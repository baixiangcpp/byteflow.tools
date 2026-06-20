import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TOOL_REGISTRY } from "@/core/registry"
import { getToolTaxonomy } from "@/core/registry/tool-taxonomy"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"

const forbiddenCopyPatterns = [
    /No data leaves your device\s*(?:—|-|--)?\s*ever/i,
    /Your (?:input|data) never leaves your (?:device|machine)/i,
    /all data (?:is )?(?:processed|processing) (?:entirely|completely)/i,
    /all processing happens locally/i,
    /every tool works offline/i,
    /100%\s+(?:local|private|privacy|本地|私密|プライベート|로컬|프라이빗|lokal|privé|Confidentialité)/i,
]

function flattenStrings(value: unknown): string[] {
    if (typeof value === "string") return [value]
    if (Array.isArray(value)) return value.flatMap(flattenStrings)
    if (value && typeof value === "object") return Object.values(value).flatMap(flattenStrings)
    return []
}

describe("BF-006 privacy copy alignment", () => {
    it("keeps translated privacy copy qualified across locales", () => {
        for (const locale of LOCALES) {
            const t = getTranslation(locale)
            const relevantCopy = [
                ...flattenStrings(t.site),
                ...flattenStrings(t.features),
                ...flattenStrings(t.common.privacy_badge),
                ...flattenStrings(t.common.privacy_faq),
                ...flattenStrings(t.common.privacy_footer),
                ...flattenStrings(t.pages),
            ].join("\n")

            for (const pattern of forbiddenCopyPatterns) {
                expect(relevantCopy, `${locale} should not contain ${pattern}`).not.toMatch(pattern)
            }
        }
    })

    it("keeps install copy from describing every tool as fully local or offline", () => {
        for (const locale of LOCALES) {
            const installCopy = JSON.stringify(getInstallPageCopy(locale))

            expect(installCopy).not.toMatch(/100%\s+(?:local|本地|ローカル|로컬|lokal)/i)
            expect(installCopy).not.toMatch(/every tool works offline/i)
            expect(installCopy).toMatch(/External|外部|外部リクエスト|외부|extern|requête/i)
        }
    })

    it("does not mark external-request tools as offline capable", () => {
        const externalTools = TOOL_REGISTRY.filter((tool) => tool.privacy.externalRequest.required)
        expect(externalTools.length).toBeGreaterThan(0)

        for (const tool of externalTools) {
            const taxonomy = getToolTaxonomy(tool)
            expect(taxonomy.capabilities, tool.slug).toContain("external-request")
            expect(taxonomy.capabilities, tool.slug).not.toContain("offline-capable")
        }
    })

    it("wires the privacy copy gate into validate", () => {
        const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> }

        expect(packageJson.scripts["check:privacy-copy"]).toBe("node scripts/gates/check-privacy-copy.js")
        expect(packageJson.scripts.validate).toContain("npm run check:privacy-copy")
    })
})
