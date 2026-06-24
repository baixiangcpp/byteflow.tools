import { LOCALES, type Locale } from "@/core/i18n/i18n"

export const SITE_URL = "https://byteflow.tools"
export const HOMEPAGE_LOCALES = LOCALES.filter((locale): locale is Exclude<Locale, "en"> => locale !== "en")

export function buildCanonicalUrl(locale: Locale, slug?: string | null) {
    return slug ? `${SITE_URL}/${locale}/${slug}` : `${SITE_URL}/${locale}`
}

export function buildHomepageCanonicalUrl(locale: Locale) {
    return locale === "en" ? SITE_URL : buildCanonicalUrl(locale)
}

export function buildLocalizedAlternates({
    slug = null,
    xDefaultUrl,
}: {
    slug?: string | null
    xDefaultUrl?: string
} = {}) {
    const languages: Record<string, string> = {}

    for (const locale of LOCALES) {
        languages[locale] = slug ? buildCanonicalUrl(locale, slug) : buildHomepageCanonicalUrl(locale)
    }

    languages["x-default"] = xDefaultUrl ?? (slug ? buildCanonicalUrl("en", slug) : SITE_URL)

    return languages
}
