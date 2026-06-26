import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { LOCALES } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import { TOOL_REGISTRY } from "@/core/registry"
import { SITE_URL } from "@/core/routing/seo-route-policy"
import { buildCollectionPageJsonLd, buildToolWebApplicationJsonLd, buildWebsiteJsonLd } from "@/core/seo/jsonld"
import { buildLocalizedAlternates } from "@/core/seo/urls"
import { buildHubMetadata, buildStaticPageMetadata, buildToolMetadata } from "@/core/seo/seo"

describe("SEO, schema, and i18n audit acceptance", () => {
    it("keeps localized route metadata self-canonical, reciprocal, and social-preview ready", () => {
        const toolMetadata = buildToolMetadata({ lang: "de", slug: "json-formatter" })
        const hubMetadata = buildHubMetadata({
            lang: "fr",
            slug: "data-code-formats",
            title: "Data & Code Formats",
            description: "Format, validate, and convert structured developer data.",
        })
        const staticMetadata = buildStaticPageMetadata({
            lang: "zh-CN",
            slug: "trust-center",
            title: "Trust Center",
            description: "Privacy and verification details for browser-local tools.",
        })

        expect(toolMetadata.alternates?.canonical).toBe(`${SITE_URL}/de/json-formatter`)
        expect(toolMetadata.alternates?.languages).toEqual(buildLocalizedAlternates({ slug: "json-formatter" }))
        expect(toolMetadata.openGraph?.images).toEqual([`${SITE_URL}/og/tools/de/json-formatter.jpg`])
        expect(toolMetadata.twitter?.images).toEqual([`${SITE_URL}/og/tools/de/json-formatter.jpg`])

        expect(hubMetadata.alternates?.canonical).toBe(`${SITE_URL}/fr/data-code-formats`)
        expect(hubMetadata.openGraph?.images).toEqual([`${SITE_URL}/og/pages/fr/data-code-formats.jpg`])
        expect(hubMetadata.twitter?.images).toEqual([`${SITE_URL}/og/pages/fr/data-code-formats.jpg`])

        expect(staticMetadata.alternates?.canonical).toBe(`${SITE_URL}/zh-CN/trust-center`)
        expect(staticMetadata.alternates?.languages).toEqual(buildLocalizedAlternates({ slug: "trust-center" }))
        expect(staticMetadata.openGraph?.locale).toBe("zh_CN")
    })

    it("indexes localized sitemap routes for every supported locale and high-value tool routes", () => {
        const urls = new Set(sitemap().map((entry) => entry.url))

        for (const locale of LOCALES) {
            if (locale === "en") {
                expect(urls).toContain(`${SITE_URL}/`)
            } else {
                expect(urls).toContain(`${SITE_URL}/${locale}`)
            }

            expect(urls).toContain(`${SITE_URL}/${locale}/trust-center`)
            expect(urls).toContain(`${SITE_URL}/${locale}/install-app`)
            expect(urls).toContain(`${SITE_URL}/${locale}/all-tools`)
            expect(urls).toContain(`${SITE_URL}/${locale}/json-formatter`)
            expect(urls).toContain(`${SITE_URL}/${locale}/jwt-decoder`)
        }
    })

    it("keeps language switching visible and localized route QA wired into release gates", () => {
        const navbarSource = readFileSync("src/components/layout/language-switcher.tsx", "utf8")
        const mobileNavbarSource = readFileSync("src/components/layout/navbar-mobile-menu.tsx", "utf8")
        const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> }

        expect(navbarSource).toContain("LOCALES.map")
        expect(navbarSource).toContain("router.replace")
        expect(navbarSource).toContain("buildHomepageHref")
        expect(navbarSource).toContain("segments.slice(1)")
        expect(mobileNavbarSource).toContain("LOCALE_NAMES")
        expect(packageJson.scripts.validate).toContain("check:i18n")
        expect(packageJson.scripts.validate).toContain("check:i18n-qa")
        expect(packageJson.scripts["build:post"]).toContain("check:hreflang")
        expect(packageJson.scripts["build:post"]).toContain("check:metadata-localization")
        expect(packageJson.scripts["build:post"]).toContain("check:rendered-i18n-copy")
    })

    it("emits required structured data fields for website, collection, and representative tools", () => {
        const website = buildWebsiteJsonLd("en")
        expect(website["@graph"]).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ "@type": "Organization", url: SITE_URL }),
                expect.objectContaining({
                    "@type": "WebSite",
                    potentialAction: expect.objectContaining({ "@type": "SearchAction" }),
                }),
            ]),
        )

        const jsonTool = TOOL_REGISTRY.find((tool) => tool.slug === "json-formatter")
        expect(jsonTool).toBeDefined()
        const toolSchema = buildToolWebApplicationJsonLd({ lang: "en", tool: jsonTool! })
        const toolCopy = getTranslation("en").tools.json_formatter
        expect(toolSchema).toMatchObject({
            "@type": "WebApplication",
            name: toolCopy.title,
            description: toolCopy.description,
            url: `${SITE_URL}/en/json-formatter`,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@id": `${SITE_URL}/#organization` },
        })

        const collectionSchema = buildCollectionPageJsonLd({
            lang: "en",
            slug: "data-code-formats",
            title: "Data & Code Formats",
            description: "Format, validate, and convert structured developer data.",
            items: [{ name: "JSON Formatter", url: `${SITE_URL}/en/json-formatter` }],
        })
        expect(collectionSchema["@graph"]).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ "@type": "CollectionPage" }),
                expect.objectContaining({
                    "@type": "ItemList",
                    itemListElement: [expect.objectContaining({ "@type": "ListItem", position: 1 })],
                }),
            ]),
        )
    })
})
