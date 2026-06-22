import type { Metadata } from "next"
import { describe, expect, it } from "vitest"
import { generateMetadata as generateAboutMetadata } from "@/app/[lang]/about/layout"
import { generateMetadata as generateContactMetadata } from "@/app/[lang]/contact/layout"
import { generateMetadata as generateInstallAppMetadata } from "@/app/[lang]/install-app/layout"
import { generateMetadata as generateTrustCenterMetadata } from "@/app/[lang]/trust-center/layout"
import { buildDefaultOgImageUrl } from "@/core/seo/seo"
import { getTranslation } from "@/core/i18n/translations/catalog"

function getTitleText(title: Metadata["title"]) {
    if (typeof title === "string") {
        return title
    }
    if (title && typeof title === "object" && "absolute" in title && typeof title.absolute === "string") {
        return title.absolute
    }
    throw new Error(`Unsupported metadata title shape: ${JSON.stringify(title)}`)
}

function getExpectedSocialTitle(title: Metadata["title"]) {
    const value = getTitleText(title)
    return value.includes("byteflow.tools") ? value : `${value} | byteflow.tools`
}

describe("static page social metadata", () => {
    it("keeps contact page social cards aligned with the page copy", async () => {
        const metadata = await generateContactMetadata({ params: Promise.resolve({ lang: "en" }) })
        const title = metadata.title
        const description = metadata.description as string
        const keywords = metadata.keywords as string[]
        const ogImage = buildDefaultOgImageUrl("en")

        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(title),
            description,
            url: "https://byteflow.tools/en/contact",
            images: [ogImage],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(title),
            description,
            images: [ogImage],
        })
        expect(keywords).toContain("Contact")
        expect(keywords).not.toContain("byteflow.tools | Privacy-first Developer Tools")
    })

    it("keeps noindex static pages on page-specific social metadata", async () => {
        const metadata = await generateAboutMetadata({ params: Promise.resolve({ lang: "de" }) })
        const description = metadata.description as string
        const ogImage = buildDefaultOgImageUrl("de")

        expect(metadata.title).toEqual({
            absolute: getTranslation("de").pages.about_title,
        })
        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(metadata.title),
            description,
            url: "https://byteflow.tools/de/about",
            images: [ogImage],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(metadata.title),
            description,
            images: [ogImage],
        })
    })

    it("keeps install-app social metadata on the install page copy", async () => {
        const metadata = await generateInstallAppMetadata({ params: Promise.resolve({ lang: "fr" }) })
        const title = metadata.title
        const description = metadata.description as string
        const ogImage = buildDefaultOgImageUrl("fr")

        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(title),
            description,
            url: "https://byteflow.tools/fr/install-app",
            images: [ogImage],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(title),
            description,
            images: [ogImage],
        })
    })

    it("keeps trust center social metadata aligned with localized trust copy", async () => {
        const metadata = await generateTrustCenterMetadata({ params: Promise.resolve({ lang: "zh-CN" }) })
        const title = metadata.title
        const description = metadata.description as string
        const ogImage = buildDefaultOgImageUrl("zh-CN")

        expect(getTitleText(title)).toBe(getTranslation("zh-CN").pages.trust_center_title)
        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(title),
            description,
            url: "https://byteflow.tools/zh-CN/trust-center",
            images: [ogImage],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(title),
            description,
            images: [ogImage],
        })
    })
})
