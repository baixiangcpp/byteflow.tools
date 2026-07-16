import { createHash } from "node:crypto"
import { existsSync, readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { LOCALES, type Locale } from "@/core/i18n/i18n"
import { getInstallPageCopy } from "@/core/utils/install-app-copy"

const GUIDE_KEYS = ["chrome_desktop", "safari_desktop", "edge", "firefox", "android", "ios"] as const
const EXPECTED_SCREENSHOT_FILES = [
    "home-en-1280x720.png",
    "install-android.png",
    "install-chrome-desktop.png",
    "install-edge.png",
    "install-firefox.png",
    "install-ios-safari.png",
    "install-safari-desktop.png",
    "json-formatter-en-1280x720.png",
] as const

describe("install-app copy localization", () => {
    it("has complete copy shape for every supported locale", () => {
        for (const locale of LOCALES) {
            const copy = getInstallPageCopy(locale)

            expect(copy.badge.trim().length).toBeGreaterThan(0)
            expect(copy.title.trim().length).toBeGreaterThan(0)
            expect(copy.subtitle.trim().length).toBeGreaterThan(0)
            expect(copy.guidePreviewLabel.trim().length).toBeGreaterThan(0)
            expect(copy.guides.chrome_desktop.label).toContain("Chrome")
            expect(copy.guides.safari_desktop.label).toContain("Safari")
            expect(copy.guides.edge.label).toContain("Edge")
            expect(copy.guides.firefox.label).toContain("Firefox")
            expect(copy.guides.android.label).toContain("Android")
            expect(copy.guides.ios.label).toContain("iOS")

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
            expect(copy.guides.safari_desktop.title).not.toBe(en.guides.safari_desktop.title)
            expect(copy.guides.safari_desktop.steps).not.toEqual(en.guides.safari_desktop.steps)
        }
    })

    it("uses distinct guide assets instead of duplicating one placeholder", () => {
        const copy = getInstallPageCopy("en")
        const guideScreenshots = GUIDE_KEYS.map((key) => copy.guides[key].screenshot)
        const screenshotDir = path.join(process.cwd(), "public", "pwa-screenshots")
        const screenshotFiles = readdirSync(screenshotDir)
            .filter((filename) => filename.endsWith(".png"))
            .sort()

        expect(new Set(guideScreenshots).size).toBe(GUIDE_KEYS.length)
        expect(screenshotFiles).toEqual([...EXPECTED_SCREENSHOT_FILES].sort())

        const hashes = new Map<string, string>()
        for (const filename of screenshotFiles) {
            const assetPath = path.join(screenshotDir, filename)
            const contents = readFileSync(assetPath)
            expect(contents.subarray(0, 8), filename).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
            expect(contents.readUInt32BE(16), `${filename} width`).toBe(1280)
            expect(contents.readUInt32BE(20), `${filename} height`).toBe(720)
            hashes.set(filename, createHash("sha256").update(contents).digest("hex"))
        }

        const guideFilenames = guideScreenshots.map((screenshot) => path.posix.basename(screenshot))
        for (const filename of guideFilenames) {
            expect(existsSync(path.join(screenshotDir, filename)), filename).toBe(true)
        }
        expect(new Set(guideFilenames).size).toBe(GUIDE_KEYS.length)
        expect(new Set(guideFilenames.map((filename) => hashes.get(filename))).size).toBe(GUIDE_KEYS.length)
        expect(new Set(hashes.values()).size).toBe(EXPECTED_SCREENSHOT_FILES.length)
    })
})
