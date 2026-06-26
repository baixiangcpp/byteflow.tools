import type { Locale } from "@/core/i18n/i18n"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { buildHomepageHref } from "@/core/routing/homepage-route"
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
        { key: "local-data-controls", slug: "privacy#local-data-controls", label: requireTranslationValue(translations.common.local_data_controls.title, "common.local_data_controls.title") },
        { key: "about", slug: "about", label: requireTranslationValue(translations.pages.about_title, "pages.about_title") },
        { key: "privacy", slug: "privacy", label: requireTranslationValue(translations.pages.privacy_title, "pages.privacy_title") },
        { key: "trust-center", slug: "trust-center", label: requireTranslationValue(translations.pages.trust_center_title, "pages.trust_center_title") },
        { key: "roadmap", slug: "roadmap", label: requireTranslationValue(translations.pages.roadmap_title, "pages.roadmap_title") },
        { key: "changelog", slug: "changelog", label: requireTranslationValue(translations.pages.changelog_title, "pages.changelog_title") },
        { key: "self-hosting", slug: "self-hosting", label: requireTranslationValue(translations.pages.self_hosting_title, "pages.self_hosting_title") },
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
            siteHref={buildHomepageHref(lang)}
        />
    )
}
