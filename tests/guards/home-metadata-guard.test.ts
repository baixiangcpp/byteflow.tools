import { describe, expect, it } from "vitest"
import { generateMetadata as generateHomeMetadata } from "@/app/[lang]/layout"
import { generateMetadata as generateLocalizedHomePageMetadata } from "@/app/[lang]/page"
import { metadata as rootPageMetadata } from "@/app/page"
import { getOgLocale } from "@/core/seo/seo"
import { getTranslation } from "@/core/i18n/translations/catalog"

describe("localized home metadata", () => {
    it("does not duplicate the site name in twitter titles", async () => {
        const metadata = await generateHomeMetadata({ params: Promise.resolve({ lang: "en" }) })

        expect(metadata.openGraph?.title).toBe("byteflow.tools | Privacy-first Developer Tools")
        expect(metadata.twitter?.title).toBe("byteflow.tools | Privacy-first Developer Tools")
        expect(metadata.twitter?.title).not.toBe("byteflow.tools | Privacy-first Developer Tools | byteflow.tools")
    })

    it("keeps localized home twitter titles aligned with the localized site title", async () => {
        const metadata = await generateHomeMetadata({ params: Promise.resolve({ lang: "zh-CN" }) })

        expect(metadata.openGraph?.title).toBe("byteflow.tools | 隐私优先的开发者工具")
        expect(metadata.twitter?.title).toBe("byteflow.tools | 隐私优先的开发者工具")
        expect(metadata.twitter?.title).not.toContain("| byteflow.tools | byteflow.tools")
    })

    it("pins the localized home page title as an absolute title", async () => {
        const metadata = await generateLocalizedHomePageMetadata({ params: Promise.resolve({ lang: "fr" }) })

        expect(metadata.title).toEqual({
            absolute: getTranslation("fr").site.title,
        })
    })

    it("pins the root landing page title as an absolute title", () => {
        expect(rootPageMetadata.title).toEqual({
            absolute: "byteflow.tools | Privacy-first Local Developer Tools",
        })
    })

    it("maps every locale to a fully qualified og:locale value", () => {
        expect(getOgLocale("en")).toBe("en_US")
        expect(getOgLocale("zh-CN")).toBe("zh_CN")
        expect(getOgLocale("zh-TW")).toBe("zh_TW")
        expect(getOgLocale("ja")).toBe("ja_JP")
        expect(getOgLocale("ko")).toBe("ko_KR")
        expect(getOgLocale("de")).toBe("de_DE")
        expect(getOgLocale("fr")).toBe("fr_FR")
    })
})
