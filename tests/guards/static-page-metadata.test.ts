import type { Metadata } from "next"
import { describe, expect, it } from "vitest"
import { generateMetadata as generateAboutMetadata } from "@/app/[lang]/about/layout"
import { generateMetadata as generateContactMetadata } from "@/app/[lang]/contact/layout"
import { generateMetadata as generateInstallAppMetadata } from "@/app/[lang]/install-app/layout"
import { DEFAULT_OG_IMAGE } from "@/core/seo/seo"
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

        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(title),
            description,
            url: "https://byteflow.tools/en/contact",
            images: [DEFAULT_OG_IMAGE],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(title),
            description,
            images: [DEFAULT_OG_IMAGE],
        })
        expect(keywords).toContain("Contact")
        expect(keywords).not.toContain("byteflow.tools | Privacy-first Developer Tools")
    })

    it("keeps noindex static pages on page-specific social metadata", async () => {
        const metadata = await generateAboutMetadata({ params: Promise.resolve({ lang: "de" }) })
        const description = metadata.description as string

        expect(metadata.title).toEqual({
            absolute: getTranslation("de").pages.about_title,
        })
        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(metadata.title),
            description,
            url: "https://byteflow.tools/de/about",
            images: [DEFAULT_OG_IMAGE],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(metadata.title),
            description,
            images: [DEFAULT_OG_IMAGE],
        })
    })

    it("keeps install-app social metadata on the install page copy", async () => {
        const metadata = await generateInstallAppMetadata({ params: Promise.resolve({ lang: "fr" }) })
        const title = metadata.title
        const description = metadata.description as string

        expect(metadata.openGraph).toMatchObject({
            title: getExpectedSocialTitle(title),
            description,
            url: "https://byteflow.tools/fr/install-app",
            images: [DEFAULT_OG_IMAGE],
        })
        expect(metadata.twitter).toMatchObject({
            card: "summary_large_image",
            title: getExpectedSocialTitle(title),
            description,
            images: [DEFAULT_OG_IMAGE],
        })
    })
})
