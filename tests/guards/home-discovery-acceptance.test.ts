import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(ROOT, relativePath), "utf8")
}

describe("home discovery acceptance guard", () => {
    it("keeps homepage positioning, primary CTA, trust badges, and follow-up paths above the catalog", () => {
        const pageSource = readSource("src/app/[lang]/page.tsx")
        const enCopy = JSON.parse(readSource("src/core/i18n/translations/en.json"))
        const metadataGuard = readSource("tests/guards/home-metadata-guard.test.ts")

        expect(pageSource).toContain("{t.site.hero_badge}")
        expect(pageSource).toContain("{t.site.hero_subtitle}")
        expect(pageSource).toContain("const heroSearchLabel = t.site.hero_search")
        expect(pageSource).toContain("<SearchButton label={heroSearchLabel} />")
        expect(pageSource).toContain('href={`/${locale}/pipeline-builder`}')
        expect(pageSource).toContain('href={`/${locale}/install-app`}')
        expect(pageSource).toContain('href={`/${locale}/compare`}')
        expect(pageSource).toContain("featureCards")
        expect(pageSource).toContain('key: "privacy"')
        expect(pageSource).toContain("t.features.privacy_title")
        expect(pageSource).toContain("t.features.privacy_desc")

        expect(enCopy.site.hero_badge).toMatch(/Open Source/i)
        expect(enCopy.site.hero_badge).toMatch(/Browser-local/i)
        expect(enCopy.site.hero_subtitle).toMatch(/without sending data to servers/i)
        expect(enCopy.site.hero_subtitle).toMatch(/stays in your browser/i)
        expect(enCopy.site.hero_search).toBe("Browse all tools")
        expect(enCopy.features.privacy_desc).toMatch(/opaque services/i)
        expect(enCopy.features.privacy_desc).toMatch(/network when you explicitly run/i)
        expect(metadataGuard).toContain("getTranslation(\"fr\").site.title")
    })

    it("links concrete developer scenarios to the expected tools using localized tool copy", () => {
        const pageSource = readSource("src/app/[lang]/page.tsx")

        expect(pageSource).toContain("type ScenarioCard")
        expect(pageSource).toContain("const scenarioCards: ScenarioCard[]")
        expect(pageSource).toContain("getLocalizedToolTitle(item.toolKey)")
        expect(pageSource).toContain("getLocalizedToolDescription(item.toolKey)")

        for (const [toolKey, slug] of [
            ["http_request_builder", "http-request-builder"],
            ["jwt_decoder", "jwt-decoder"],
            ["log_scrubber", "log-scrubber"],
            ["json_formatter", "json-formatter"],
            ["svg_optimizer", "svg-optimizer"],
        ] as const) {
            expect(pageSource).toContain(`toolKey: "${toolKey}"`)
            expect(pageSource).toContain(`slug: "${slug}"`)
        }

        expect(pageSource).toMatch(/scenarioCards\.map[\s\S]*href=\{`\/\$\{locale\}\/\$\{item\.slug\}`\}/)
    })

    it("keeps All Tools discovery incrementally rendered, documented, and crawlable", () => {
        const allToolsSource = readSource("src/features/tool-discovery/all-tools-discovery.tsx")
        const componentTestSource = readSource("tests/component/all-tools-discovery.test.tsx")
        const budgetDoc = readSource("docs/performance/performance-budget.md")

        expect(allToolsSource).toContain("INITIAL_GROUP_TOOL_LIMIT = 6")
        expect(allToolsSource).toContain("visibleTools = hasOverflowTools && !isExpanded")
        expect(allToolsSource).toContain("compactTools = hasOverflowTools && !isExpanded")
        expect(allToolsSource).toContain('data-all-tools-card="true"')
        expect(allToolsSource).toContain('data-all-tools-compact-link="true"')
        expect(allToolsSource).toContain("aria-expanded={isExpanded}")

        expect(componentTestSource).toContain("LARGE_INVENTORY_TOOL_COUNT = 300")
        expect(componentTestSource).toContain("LARGE_INVENTORY_CARD_BUDGET = 6")
        expect(componentTestSource).toContain("LARGE_INVENTORY_COMPACT_LINK_BUDGET")
        expect(componentTestSource).toContain("Synthetic Tool 299")

        expect(budgetDoc).toContain("All Tools Discovery Budget")
        expect(budgetDoc).toContain("Risk baseline")
        expect(budgetDoc).toContain("Current after state")
        expect(budgetDoc).toContain("300 synthetic tools")
        expect(budgetDoc).toContain("6 rich cards")
        expect(budgetDoc).toContain("294 compact crawlable links")
        expect(budgetDoc).toContain("/en/all-tools")
    })
})
