import { describe, expect, it } from "vitest"
import { metadata as rootNotFoundMetadata } from "@/app/not-found"
import { generateMetadata as generateLangNotFoundMetadata } from "@/app/[lang]/not-found"
import { DEFAULT_OG_IMAGE } from "@/core/seo/seo"
import { getTranslation } from "@/core/i18n/translations/catalog"

describe("not-found metadata", () => {
    it("pins root not-found metadata to page-specific noindex copy", () => {
        expect(rootNotFoundMetadata.title).toEqual({
            absolute: "Page not found | byteflow.tools",
        })
        expect(rootNotFoundMetadata.description).toBe(
            "The page does not exist. Choose a language and continue from the all-tools directory.",
        )
        expect(rootNotFoundMetadata.keywords).toEqual(["Page not found", "404", "missing page", "byteflow.tools"])
        expect(rootNotFoundMetadata.robots).toMatchObject({
            index: false,
            follow: false,
        })
        expect(rootNotFoundMetadata.openGraph).toMatchObject({
            title: "Page not found | byteflow.tools",
            images: [DEFAULT_OG_IMAGE],
        })
        expect(rootNotFoundMetadata.twitter).toMatchObject({
            title: "Page not found | byteflow.tools",
            images: [DEFAULT_OG_IMAGE],
        })
    })

    it("localizes lang not-found metadata instead of inheriting homepage metadata", async () => {
        const metadata = await generateLangNotFoundMetadata({ params: Promise.resolve({ lang: "fr" }) })
        const t = getTranslation("fr")

        expect(metadata.title).toEqual({
            absolute: `${t.common.not_found_title} | byteflow.tools`,
        })
        expect(metadata.description).toBe(t.common.not_found_description)
        expect(metadata.keywords).toEqual([t.common.not_found_title, "404", "byteflow.tools"])
        expect(metadata.robots).toMatchObject({
            index: false,
            follow: false,
        })
        expect(metadata.openGraph).toMatchObject({
            title: `${t.common.not_found_title} | byteflow.tools`,
            description: t.common.not_found_description,
            images: [DEFAULT_OG_IMAGE],
        })
        expect(metadata.twitter).toMatchObject({
            title: `${t.common.not_found_title} | byteflow.tools`,
            description: t.common.not_found_description,
            images: [DEFAULT_OG_IMAGE],
        })
    })
})
