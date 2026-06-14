import { describe, expect, it } from "vitest"
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy"
import {
    LOCALIZED_ARTICLES,
    getLocalizedArticle,
    type LocalizedArticleSlug,
    type NonEnglishLocale,
} from "@/core/seo/localized-articles"

describe("localized article registry", () => {
    it("defines concrete localized content for every non-English article page", () => {
        for (const slug of Object.keys(LOCALIZED_ARTICLES) as LocalizedArticleSlug[]) {
            const article = LOCALIZED_ARTICLES[slug]

            for (const locale of Object.keys(article.locales) as NonEnglishLocale[]) {
                const localized = getLocalizedArticle(slug, locale)

                expect(localized.copy.title.length).toBeGreaterThan(0)
                expect(localized.copy.description.length).toBeGreaterThan(0)
                expect(localized.copy.sections.length).toBeGreaterThan(0)
                expect(localized.copy.exampleInput.length).toBeGreaterThan(0)
                expect(localized.copy.exampleOutput.length).toBeGreaterThan(0)
            }
        }
    })

    it("uses article-specific localized metadata for content pages", () => {
        const localized = getLocalizedMetaCopy({
            slug: "image-privacy-how-to-censor-and-protect-images",
            locale: "ja",
            fallbackTitle: "Image Privacy: How to Censor and Protect Images",
            fallbackDescription: "fallback",
        })

        expect(localized.title).toBe("画像プライバシー: 画像を隠して保護する方法")
        expect(localized.description).toContain("スクリーンショット")
    })

    it("uses digest-generator naming for focused hash pages", () => {
        const localized = getLocalizedMetaCopy({
            slug: "sha256-digest-generator",
            locale: "fr",
            fallbackTitle: "SHA-256 Digest Generator",
            fallbackDescription: "fallback",
        })

        expect(localized.title).toBe("Générateur de digest SHA-256")
        expect(localized.title).not.toContain("Chiffrer")
    })
})
