import fs from "node:fs"
import path from "node:path"
import { metadata as rootMetadata } from "@/app/page"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { SITE_URL } from "@/core/seo/urls"
import { describe, expect, it } from "vitest"

describe("root x-default page guard", () => {
    it("keeps the root page on the original English homepage instead of a duplicate redesign", () => {
        const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8")

        expect(pageSource).not.toContain('import Script from "next/script"')
        expect(pageSource).not.toContain("root-locale-redirect.js")
        expect(pageSource).not.toContain("window.location.replace")
        expect(pageSource).not.toContain("navigator.language")
        expect(pageSource).not.toContain("t.site.root_language_title")
        expect(pageSource).not.toContain("t.site.root_language_desc")
        expect(pageSource).not.toContain("t.site.root_badge")
        expect(pageSource).not.toContain("t.site.root_title")
        expect(pageSource).toContain('import LocalizedHomePage from "@/app/[lang]/page"')
        expect(pageSource).toContain('<LocalizedHomePage params={Promise.resolve({ lang: locale })} />')
        expect(pageSource).toContain("ServerNavbar")
        expect(pageSource).toContain("ServerFooter")
        expect(pageSource).toContain("LangProvider")

        const languages = rootMetadata.alternates?.languages as Record<string, string>
        expect(rootMetadata.alternates?.canonical).toBe(SITE_URL)
        expect(languages["x-default"]).toBe(SITE_URL)
        for (const locale of LOCALES) {
            expect(languages[locale]).toBe(locale === "en" ? SITE_URL : `${SITE_URL}/${locale}`)
        }
        expect(rootMetadata.robots).toMatchObject({ index: true, follow: true })
        expect(rootMetadata.description).toContain("No signup")
        expect(rootMetadata.description).toContain("installable as a PWA")
    })

    it("keeps the reused homepage copy localized in every supported locale", () => {
        for (const locale of LOCALES) {
            const siteCopy = getTranslation(locale).site
            for (const key of [
                "hero_badge",
                "hero_title_highlight",
                "hero_title_2",
                "hero_subtitle",
                "hero_search",
                "popular_tools_title",
                "popular_tools_subtitle",
                "explore_by_category_title",
                "explore_by_category_subtitle",
            ] as const) {
                const value = siteCopy[key]
                expect(typeof value, `${locale}.${key}`).toBe("string")
                expect(value.trim().length, `${locale}.${key}`).toBeGreaterThan(0)
            }
        }
    })
})
