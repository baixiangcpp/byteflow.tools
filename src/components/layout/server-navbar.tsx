import type { Locale } from "@/core/i18n/i18n"
import { requireTranslationValue } from "@/core/i18n/i18n"
import { Navbar } from "./navbar"
import type { TranslationSchema } from "@/core/i18n/translations/catalog"

export function ServerNavbar({
    lang,
    translations,
}: {
    lang: Locale
    translations: TranslationSchema
}) {
    return (
        <Navbar
            lang={lang}
            labels={{
                allTools: requireTranslationValue(translations.common.all_tools, "common.all_tools"),
                openNavigation: `${requireTranslationValue(translations.common.open, "common.open")} ${requireTranslationValue(translations.nav.navigation, "nav.navigation")}`,
                search: requireTranslationValue(translations.nav.search, "nav.search"),
            }}
        />
    )
}
