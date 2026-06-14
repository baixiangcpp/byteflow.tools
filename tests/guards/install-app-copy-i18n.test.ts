import { describe, expect, it } from "vitest"
import { LOCALES, type Locale } from "@/core/i18n/i18n"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"

const GUIDE_KEYS = ["chrome_desktop", "android", "ios", "edge", "firefox"] as const

describe("install-app copy localization", () => {
    it("has complete copy shape for every supported locale", () => {
        for (const locale of LOCALES) {
            const copy = getInstallPageCopy(locale)

            expect(copy.badge.trim().length).toBeGreaterThan(0)
            expect(copy.title.trim().length).toBeGreaterThan(0)
            expect(copy.subtitle.trim().length).toBeGreaterThan(0)
            expect(copy.guidePreviewLabel.trim().length).toBeGreaterThan(0)

            expect(copy.benefits).toHaveLength(3)
            for (const benefit of copy.benefits) {
                expect(benefit.title.trim().length).toBeGreaterThan(0)
                expect(benefit.description.trim().length).toBeGreaterThan(0)
            }

            expect(Object.keys(copy.guides).sort()).toEqual([...GUIDE_KEYS].sort())
            for (const key of GUIDE_KEYS) {
                const guide = copy.guides[key]
                expect(guide.label.trim().length).toBeGreaterThan(0)
                expect(guide.title.trim().length).toBeGreaterThan(0)
                expect(guide.steps.length).toBeGreaterThanOrEqual(3)
                for (const step of guide.steps) {
                    expect(step.trim().length).toBeGreaterThan(0)
                }
                expect(guide.screenshot.trim().length).toBeGreaterThan(0)
            }

            expect(copy.faq).toHaveLength(5)
            for (const item of copy.faq) {
                expect(item.question.trim().length).toBeGreaterThan(0)
                expect(item.answer.trim().length).toBeGreaterThan(0)
            }
        }
    })

    it("does not fallback to english for key localized fields", () => {
        const en = getInstallPageCopy("en")
        const nonEnLocales = LOCALES.filter((locale): locale is Exclude<Locale, "en"> => locale !== "en")

        for (const locale of nonEnLocales) {
            const copy = getInstallPageCopy(locale)
            expect(copy.title).not.toBe(en.title)
            expect(copy.subtitle).not.toBe(en.subtitle)
            expect(copy.guidePreviewLabel).not.toBe(en.guidePreviewLabel)
            expect(copy.benefits[0].title).not.toBe(en.benefits[0].title)
            expect(copy.faq[0].question).not.toBe(en.faq[0].question)
        }
    })
})
