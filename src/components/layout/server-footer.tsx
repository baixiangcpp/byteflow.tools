import type { Locale } from "@/core/i18n/i18n"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { FooterContent } from "./footer-content"
import type { TranslationSchema } from "@/core/i18n/translations/catalog"

export function ServerFooter({
    lang,
    translations,
}: {
    lang: Locale
    translations: TranslationSchema
}) {
    const categoryLinks = MENU_GROUP_DEFS.map((group) => ({
        key: group.navKey,
        href: `/${lang}/${group.slug}`,
        label: requireTranslationValue(translations.nav[group.navKey], `nav.${group.navKey}`),
    }))

    const pageLinks = [
        { key: "install-app", slug: "install-app", label: requireTranslationValue(translations.common.install_app_label, "common.install_app_label") },
        { key: "about", slug: "about", label: requireTranslationValue(translations.pages.about_title, "pages.about_title") },
        { key: "privacy", slug: "privacy", label: requireTranslationValue(translations.pages.privacy_title, "pages.privacy_title") },
        { key: "trust-center", slug: "trust-center", label: requireTranslationValue(translations.pages.trust_center_title, "pages.trust_center_title") },
        { key: "terms", slug: "terms", label: requireTranslationValue(translations.pages.terms_title, "pages.terms_title") },
        { key: "contact", slug: "contact", label: requireTranslationValue(translations.pages.contact_title, "pages.contact_title") },
    ].map((page) => ({
        ...page,
        href: `/${lang}/${page.slug}`,
    }))

    const footerCopyright = requireTranslationValue(translations.common.footer_copyright, "common.footer_copyright").replace(
        "{year}",
        String(new Date().getUTCFullYear()),
    )

    return (
        <FooterContent
            allToolsLabel={requireTranslationValue(translations.common.all_tools, "common.all_tools")}
            categoryLinks={categoryLinks}
            footerCopyright={footerCopyright}
            navigationLabel={requireTranslationValue(translations.nav.navigation, "nav.navigation")}
            pageLinks={pageLinks}
            siteDescription={translations.site.description}
            siteHref={`/${lang}`}
        />
    )
}
