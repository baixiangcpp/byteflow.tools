"use client"

import { useLang } from "@/core/i18n/lang-provider"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { MENU_GROUP_DEFS } from "@/core/registry/menu-groups"
import { FooterContent } from "./footer-content"

export function Footer() {
    const { t, lang } = useLang()

    const categoryLinks = MENU_GROUP_DEFS.map((group) => ({
        key: group.navKey,
        slug: group.slug,
    }))

    const pageLinks = [
        { key: "install-app", slug: "install-app", label: requireTranslationValue(t.common.install_app_label, "common.install_app_label") },
        { key: "about", slug: "about", label: requireTranslationValue(t.pages.about_title, "pages.about_title") },
        { key: "privacy", slug: "privacy", label: requireTranslationValue(t.pages.privacy_title, "pages.privacy_title") },
        { key: "terms", slug: "terms", label: requireTranslationValue(t.pages.terms_title, "pages.terms_title") },
        { key: "contact", slug: "contact", label: requireTranslationValue(t.pages.contact_title, "pages.contact_title") },
    ] as const
    const year = new Date().getUTCFullYear()
    const footerCopyright = requireTranslationValue(t.common.footer_copyright, "common.footer_copyright").replace(
        "{year}",
        String(year),
    )

    return (
        <FooterContent
            allToolsLabel={requireTranslationValue(t.common.all_tools, "common.all_tools")}
            categoryLinks={categoryLinks.map((cat) => ({
                ...cat,
                href: `/${lang}/${cat.slug}`,
                label: requireTranslationValue(t.nav[cat.key], `nav.${cat.key}`),
            }))}
            footerCopyright={footerCopyright}
            navigationLabel={requireTranslationValue(t.nav.navigation, "nav.navigation")}
            pageLinks={pageLinks.map((page) => ({
                ...page,
                href: `/${lang}/${page.slug}`,
            }))}
            siteDescription={t.site.description}
            siteHref={`/${lang}`}
        />
    )
}
