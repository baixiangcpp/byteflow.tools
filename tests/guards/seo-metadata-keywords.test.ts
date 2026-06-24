import { describe, expect, it } from "vitest"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"
import { buildContentMetadata, buildDefaultOgImageUrl, buildHubMetadata, buildPageOgImageUrl, buildSiteKeywords, buildStaticPageMetadata, buildToolMetadata, buildToolOgImageUrl } from "@/core/seo/seo"
import { getTranslation } from "@/core/i18n/translations/catalog"

const ZH_FREE_ONLINE_TOOL = "\u514d\u8d39\u5728\u7ebf\u5de5\u5177"
const JA_DEVELOPER_GUIDE = "\u958b\u767a\u30ac\u30a4\u30c9"

describe("seo metadata keywords", () => {
    it("keeps english tool keywords for english routes", () => {
        const metadata = buildToolMetadata({ lang: "en", slug: "json-formatter" })

        expect(metadata.keywords).toContain("json formatter")
    })

    it("localizes tool keywords for non-english routes", () => {
        const metadata = buildToolMetadata({ lang: "zh-CN", slug: "json-formatter" })
        const keywords = metadata.keywords as string[]
        const t = getTranslation("zh-CN")

        expect(keywords).toContain(t.tools.json_formatter.title)
        expect(keywords).toContain(ZH_FREE_ONLINE_TOOL)
        expect(keywords).not.toContain("json formatter")
    })

    it("localizes content keywords for non-english routes", () => {
        const metadata = buildContentMetadata({
            lang: "ja",
            slug: "json-vs-json5-differences",
            title: "JSON vs JSON5: What Changes and When to Use Each",
            description: "Compare JSON and JSON5 syntax, parser support, and migration gotchas.",
        })
        const keywords = metadata.keywords as string[]
        const localizedMeta = getLocalizedMetaCopy({
            slug: "json-vs-json5-differences",
            locale: "ja",
            fallbackTitle: "JSON vs JSON5: What Changes and When to Use Each",
            fallbackDescription: "Compare JSON and JSON5 syntax, parser support, and migration gotchas.",
        })

        expect(keywords).toContain(localizedMeta.title)
        expect(keywords).toContain(JA_DEVELOPER_GUIDE)
    })

    it("builds localized site keyword packs", () => {
        expect(buildSiteKeywords({ lang: "fr", title: "byteflow.tools | Outils developpeur respectueux de la vie privee" })).toContain("outils developpeur")
    })

    it("uses jpeg localized OG images for tool metadata", () => {
        const metadata = buildToolMetadata({ lang: "zh-CN", slug: "json-formatter" })
        const ogImages = metadata.openGraph?.images as string[]
        const twitterImages = metadata.twitter?.images as string[]

        expect(buildToolOgImageUrl("zh-CN", "json-formatter")).toBe("https://byteflow.tools/og/tools/zh-CN/json-formatter.jpg")
        expect(ogImages).toEqual(["https://byteflow.tools/og/tools/zh-CN/json-formatter.jpg"])
        expect(twitterImages).toEqual(["https://byteflow.tools/og/tools/zh-CN/json-formatter.jpg"])
    })

    it("uses page-specific OG images for content and hub pages", () => {
        const metadata = buildContentMetadata({
            lang: "fr",
            slug: "json-vs-json5-differences",
            title: "JSON vs JSON5: What Changes and When to Use Each",
            description: "Compare JSON and JSON5 syntax, parser support, and migration gotchas.",
        })
        const hubMetadata = buildHubMetadata({
            lang: "fr",
            slug: "images-svg-css",
            title: "Images, SVG & CSS",
            description: "Local image and SVG tools.",
        })

        expect(buildPageOgImageUrl("fr", "json-vs-json5-differences")).toBe("https://byteflow.tools/og/pages/fr/json-vs-json5-differences.jpg")
        expect(metadata.openGraph?.images).toEqual(["https://byteflow.tools/og/pages/fr/json-vs-json5-differences.jpg"])
        expect(metadata.twitter?.images).toEqual(["https://byteflow.tools/og/pages/fr/json-vs-json5-differences.jpg"])
        expect(hubMetadata.openGraph?.images).toEqual(["https://byteflow.tools/og/pages/fr/images-svg-css.jpg"])
    })

    it("keeps locale-aware default OG images for static utility pages", () => {
        const metadata = buildStaticPageMetadata({
            lang: "fr",
            slug: "privacy",
            title: "Privacy Policy",
            description: "Privacy information.",
        })

        expect(buildDefaultOgImageUrl("fr")).toBe("https://byteflow.tools/og/default/fr.jpg")
        expect(metadata.openGraph?.images).toEqual(["https://byteflow.tools/og/default/fr.jpg"])
        expect(metadata.twitter?.images).toEqual(["https://byteflow.tools/og/default/fr.jpg"])
    })
})
