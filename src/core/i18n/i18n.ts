// Locale extension checklist:
// 1) Add locale here (`LOCALES`, `LOCALE_NAMES`).
// 2) Add `src/core/i18n/translations/{locale}.json`.
// 3) Add route-intent copy in `src/core/seo/route-intent-copy.ts`.
// 4) Add any shared-shell/common keys consumed by `useLang()` surfaces.
// 5) Add template copy + localized tool-content data in
//    `src/core/seo/components/tool-content-template-modules/generated/*`
//    (rendered through `src/core/seo/components/tool-content-template-server.tsx`).
// 6) Keep shared shell / 404 copy sourced from locale JSON, not source-level maps.
// 7) Add SEO snippet boosts in `src/core/seo/seo.ts`; `src/lib/seo.ts` is a legacy re-export shim.
export const LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko", "de", "fr"] as const
export type Locale = typeof LOCALES[number]
export const DEFAULT_LOCALE: Locale = "en"

export const LOCALE_NAMES: Record<Locale, string> = {
    en: "English",
    "zh-CN": "\u7b80\u4f53\u4e2d\u6587",
    "zh-TW": "\u7e41\u9ad4\u4e2d\u6587",
    ja: "\u65e5\u672c\u8a9e",
    ko: "\ud55c\uad6d\uc5b4",
    de: "Deutsch",
    fr: "Fran\u00e7ais",
}

export function isValidLocale(lang: string): lang is Locale {
    return LOCALES.includes(lang as Locale)
}

export function requireTranslationValue(value: string | undefined, keyPath: string): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`[i18n] Missing translation value for ${keyPath}`)
    }

    return value
}
