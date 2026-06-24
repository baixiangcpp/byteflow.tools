import type { Locale } from "@/core/i18n/i18n"

export function buildHomepageHref(locale: Locale) {
    return locale === "en" ? "/" : `/${locale}`
}
