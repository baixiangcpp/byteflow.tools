import type { Metadata } from "next"
import robots from "@/app/robots"
import { metadata as rootMetadata } from "@/app/page"
import { generateMetadata as generateLocalizedHomePageMetadata } from "@/app/[lang]/page"
import { LOCALES } from "@/core/i18n/i18n"
import { buildToolMetadata } from "@/core/seo/seo"
import { SITE_URL, buildCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls"
import { describe, expect, it } from "vitest"

function getLanguages(metadata: { alternates?: Metadata["alternates"] }) {
    return metadata.alternates?.languages as Record<string, string>
}

describe("SEO canonical and hreflang foundation", () => {
    it("builds canonical URLs and hreflang alternates from one helper", () => {
        expect(buildCanonicalUrl("de", "json-formatter")).toBe("https://byteflow.tools/de/json-formatter")

        const toolAlternates = buildLocalizedAlternates({ slug: "json-formatter" })
        for (const locale of LOCALES) {
            expect(toolAlternates[locale]).toBe(`https://byteflow.tools/${locale}/json-formatter`)
        }
        expect(toolAlternates["x-default"]).toBe("https://byteflow.tools/en/json-formatter")

        const homeAlternates = buildLocalizedAlternates()
        for (const locale of LOCALES) {
            expect(homeAlternates[locale]).toBe(`https://byteflow.tools/${locale}`)
        }
        expect(homeAlternates["x-default"]).toBe(SITE_URL)
    })

    it("gives tool pages a self canonical, every locale alternate, and x-default", () => {
        const metadata = buildToolMetadata({ lang: "fr", slug: "json-formatter" })
        const languages = getLanguages(metadata)

        expect(metadata.alternates?.canonical).toBe("https://byteflow.tools/fr/json-formatter")
        for (const locale of LOCALES) {
            expect(languages[locale]).toBe(`https://byteflow.tools/${locale}/json-formatter`)
        }
        expect(languages["x-default"]).toBe("https://byteflow.tools/en/json-formatter")
    })

    it("keeps root and localized home x-default on the root entry point", async () => {
        const rootLanguages = getLanguages(rootMetadata)
        const homeMetadata = await generateLocalizedHomePageMetadata({
            params: Promise.resolve({ lang: "ja" }),
        })
        const homeLanguages = getLanguages(homeMetadata)

        expect(rootMetadata.alternates?.canonical).toBe(SITE_URL)
        expect(rootLanguages["x-default"]).toBe(SITE_URL)
        expect(homeMetadata.alternates?.canonical).toBe("https://byteflow.tools/ja")
        expect(homeLanguages["x-default"]).toBe(SITE_URL)
    })

    it("keeps robots crawlable while blocking handoff query entry points", () => {
        const robotsConfig = robots()
        const rules = Array.isArray(robotsConfig.rules) ? robotsConfig.rules[0] : robotsConfig.rules
        const disallow = Array.isArray(rules.disallow) ? rules.disallow : [rules.disallow]

        expect(robotsConfig.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
        expect(rules.allow).toBe("/")
        expect(disallow).toEqual(expect.arrayContaining(["*?handoff=", "*?handoff_ref="]))
    })
})
