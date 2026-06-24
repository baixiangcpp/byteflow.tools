import fs from "node:fs"
import path from "node:path"
import { metadata as rootMetadata } from "@/app/page"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { SITE_URL } from "@/core/seo/urls"
import { describe, expect, it } from "vitest"

const ROOT_SITE_COPY_KEYS = [
    "root_badge",
    "root_title",
    "root_subtitle",
    "root_cta_search",
    "root_cta_browse",
    "root_cta_install",
    "root_free_title",
    "root_free_desc",
    "root_local_title",
    "root_local_desc",
    "root_verifiable_title",
    "root_verifiable_desc",
    "root_language_title",
    "root_language_desc",
    "root_popular_title",
    "root_popular_subtitle",
    "root_categories_title",
    "root_categories_subtitle",
    "root_privacy_title",
    "root_privacy_desc",
    "root_privacy_policy",
    "root_trust_center",
    "root_free_open_source",
] as const

describe("root x-default page guard", () => {
    it("keeps the root page as a complete crawlable x-default landing page", () => {
        const pageSource = fs.readFileSync(path.join(process.cwd(), "src/app/page.tsx"), "utf8")
        const englishSiteCopy = getTranslation("en").site

        expect(pageSource).not.toContain('import Script from "next/script"')
        expect(pageSource).not.toContain("root-locale-redirect.js")
        expect(pageSource).not.toContain("window.location.replace")
        expect(pageSource).not.toContain("navigator.language")
        expect(pageSource).toContain("t.site.root_badge")
        expect(pageSource).toContain("t.site.root_title")
        expect(pageSource).toContain("t.site.root_cta_search")
        expect(pageSource).toContain('href="/en/all-tools#tool-discovery"')
        expect(pageSource).toContain("t.site.root_cta_browse")
        expect(pageSource).toContain('href="/en/install-app"')
        expect(pageSource).toContain("t.site.root_cta_install")
        expect(pageSource).toContain('"json_formatter"')
        expect(pageSource).toContain('"jwt_decoder"')
        expect(pageSource).toContain('"base64_encode_decode"')
        expect(pageSource).toContain('"hash_generator"')
        expect(pageSource).toContain('"url_encode_decode"')
        expect(pageSource).toContain('"uuid_generator"')
        expect(pageSource).toContain('"regex_tester"')
        expect(pageSource).toContain('"markdown_preview"')
        expect(pageSource).toContain("t.site.root_categories_title")
        expect(pageSource).toContain("t.site.root_language_title")
        expect(englishSiteCopy.root_language_desc).toContain("does not force a first-visit redirect")
        expect(pageSource).toContain('href="/en/privacy"')
        expect(pageSource).toContain("t.site.root_privacy_policy")
        expect(pageSource).toContain('href="/en/trust-center"')
        expect(pageSource).toContain("t.site.root_trust_center")
        expect(englishSiteCopy.root_free_desc).toContain("No signup, no account")

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

    it("keeps root x-default copy localized in every supported locale", () => {
        for (const locale of LOCALES) {
            const siteCopy = getTranslation(locale).site
            for (const key of ROOT_SITE_COPY_KEYS) {
                const value = siteCopy[key]
                expect(typeof value, `${locale}.${key}`).toBe("string")
                expect(value.trim().length, `${locale}.${key}`).toBeGreaterThan(0)
            }
        }
    })
})
