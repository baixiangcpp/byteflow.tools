import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"

const PROJECT_ROOT = process.cwd()

function readSource(relativePath: string): string {
    return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8")
}

describe("all-tools route guard", () => {
    const hardcodedFormatValidateHrefPattern =
        /href\s*=\s*(?:\{`[^`]*format-validate[^`]*`\}|\{["'][^"'}]*format-validate[^"'}]*["']\}|"[^"]*format-validate[^"]*"|'[^']*format-validate[^']*')/m

    it("detects hardcoded format-validate href patterns", () => {
        expect('href="/en/format-validate"').toMatch(hardcodedFormatValidateHrefPattern)
        expect("href={'/en/format-validate'}").toMatch(hardcodedFormatValidateHrefPattern)
        expect("href={getAllToolsHref('en')}").not.toMatch(hardcodedFormatValidateHrefPattern)
    })

    it("keeps key CTA surfaces on unified all-tools routing helper", () => {
        const ctaFiles = [
            "src/features/install-app/components/install-app-client.tsx",
            "src/components/layout/lang-not-found-content.tsx",
            "src/app/not-found.tsx",
            "src/components/layout/navbar.tsx",
        ]

        for (const file of ctaFiles) {
            const source = readSource(file)
            expect(source, `${file} should use getAllToolsHref helper`).toContain("getAllToolsHref")
            expect(source, `${file} should not hardcode format-validate in href`).not.toMatch(hardcodedFormatValidateHrefPattern)
        }

        const langNotFoundSource = readSource("src/app/[lang]/not-found.tsx")
        expect(langNotFoundSource, "src/app/[lang]/not-found.tsx should render the localized not-found CTA content").toContain("LangNotFoundContent")
        expect(langNotFoundSource, "src/app/[lang]/not-found.tsx should not hardcode format-validate in href").not.toMatch(hardcodedFormatValidateHrefPattern)
    })

    it("keeps the public all-tools URL backed by a real route", () => {
        expect(readSource("src/core/routing/all-tools-route.ts")).toContain("`/${locale}/all-tools`")
        expect(fs.existsSync(path.join(PROJECT_ROOT, "src/app/[lang]/all-tools/page.tsx"))).toBe(true)
        expect(fs.existsSync(path.join(PROJECT_ROOT, "src/app/[lang]/all-tools/layout.tsx"))).toBe(true)
    })

    it("keeps home all-tools section id aligned to shared constant", () => {
        const source = readSource("src/app/[lang]/page.tsx")
        expect(source).toContain("ALL_TOOLS_SECTION_ID")
        expect(source).not.toContain('id="tool-categories"')
    })

    it("prevents all-tools label from pointing to category routes in lazy catalog", () => {
        const source = readSource("src/features/home/components/lazy-tool-catalog.tsx")
        const misboundAllToolsLabelPattern = /href=\{group\.href\}[\s\S]{0,1200}\{allToolsLabel\}/m
        const groupOpenLinkPattern = /href=\{group\.href\}[\s\S]{0,1200}\{openLabel\}/m

        expect(source, "group route links should not use allToolsLabel copy").not.toMatch(misboundAllToolsLabelPattern)
        expect(source, "group route links should use openLabel copy").toMatch(groupOpenLinkPattern)
    })
})
