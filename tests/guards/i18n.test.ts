import { describe, expect, it } from "vitest"
import { DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, isValidLocale, requireTranslationValue } from "@/core/i18n/i18n"
import { TRANSLATIONS, getEnglishToolSearchAliases, getTranslation } from "@/core/i18n/translations/catalog"

describe("i18n utilities", () => {
    it("exports exactly 7 locales", () => {
        expect(LOCALES.length).toBe(7)
        expect(LOCALES).toContain("en")
        expect(LOCALES).toContain("zh-CN")
        expect(LOCALES).toContain("fr")
    })

    it("defines English as the default locale", () => {
        expect(DEFAULT_LOCALE).toBe("en")
    })

    it("provides matching locale names", () => {
        expect(LOCALE_NAMES.en).toBe("English")
        expect(LOCALE_NAMES["zh-CN"]).toBe("\u7b80\u4f53\u4e2d\u6587")
        expect(LOCALE_NAMES["zh-TW"]).toBe("\u7e41\u9ad4\u4e2d\u6587")
        expect(LOCALE_NAMES.ja).toBe("\u65e5\u672c\u8a9e")
        expect(LOCALE_NAMES.ko).toBe("\ud55c\uad6d\uc5b4")
        expect(LOCALE_NAMES.de).toBe("Deutsch")
        expect(LOCALE_NAMES.fr).toBe("Fran\u00e7ais")
    })

    it("correctly validates configured locales", () => {
        expect(isValidLocale("en")).toBe(true)
        expect(isValidLocale("zh-CN")).toBe(true)
        expect(isValidLocale("es")).toBe(false)
        expect(isValidLocale("EN")).toBe(false)
    })

    it("fails fast on missing translation values", () => {
        expect(requireTranslationValue("Ready", "common.ready")).toBe("Ready")
        expect(() => requireTranslationValue("", "common.ready")).toThrow("[i18n] Missing translation value for common.ready")
        expect(() => requireTranslationValue(undefined, "common.ready")).toThrow("[i18n] Missing translation value for common.ready")
    })

    it("returns locale catalogs directly without English fallback merging", () => {
        expect(getTranslation("en")).toBe(TRANSLATIONS.en)
        expect(getTranslation("fr")).toBe(TRANSLATIONS.fr)
        expect(getTranslation("zh-CN")).toBe(TRANSLATIONS["zh-CN"])
    })

    it("exposes a minimal English tool alias search map", () => {
        const aliases = getEnglishToolSearchAliases()

        expect(aliases.json_formatter?.title).toBe(TRANSLATIONS.en.tools.json_formatter.title)
        expect(aliases.json_formatter?.description).toBe(TRANSLATIONS.en.tools.json_formatter.description)
        expect(Object.keys(aliases).length).toBe(Object.keys(TRANSLATIONS.en.tools).length)
    })
})
