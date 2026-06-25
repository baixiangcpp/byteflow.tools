import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"

const ROOT = process.cwd()

function readSource(relativePath: string) {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("IA count copy stability", () => {
    it("keeps home and all-tools surfaces on registry stats", () => {
        const homeSource = readSource("src/app/[lang]/page.tsx")
        const allToolsSource = readSource("src/app/[lang]/all-tools/page.tsx")
        const rootSource = readSource("src/app/page.tsx")

        expect(homeSource).toContain("getToolRegistryStats")
        expect(homeSource).toContain("formatToolRegistryStatsTemplate")
        expect(allToolsSource).toContain("getToolRegistryStats")
        expect(allToolsSource).toContain("totalTools={registryStats.totalTools}")
        expect(rootSource).toContain('import LocalizedHomePage from "@/app/[lang]/page"')
        expect(rootSource).toContain("<LocalizedHomePage")
        expect(rootSource).not.toContain("t.site.root_title")
    })

    it("keeps localized count copy as registry-backed templates", () => {
        for (const locale of LOCALES) {
            const t = getTranslation(locale)

            expect(t.site.hero_title_highlight, `${locale} site.hero_title_highlight`).toContain("{toolCount}")
            expect(t.features.keyboard_desc, `${locale} features.keyboard_desc`).toContain("{categoryCount}")
            expect(t.features.keyboard_desc, `${locale} features.keyboard_desc`).not.toMatch(
                /Six\s+top-level\s+categories|6\s*个一级分类|6\s*個一級分類|6つの主要カテゴリ|6개의 상위 카테고리|Sechs Hauptkategorien|Six catégories principales/i,
            )
        }
    })
})
