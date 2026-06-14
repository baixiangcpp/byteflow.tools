import type { Locale } from "@/core/i18n/i18n";

import en from "@/core/i18n/translations/en.json";
import zhCN from "@/core/i18n/translations/zh-CN.json";
import zhTW from "@/core/i18n/translations/zh-TW.json";
import ja from "@/core/i18n/translations/ja.json";
import ko from "@/core/i18n/translations/ko.json";
import de from "@/core/i18n/translations/de.json";
import fr from "@/core/i18n/translations/fr.json";

export type TranslationSchema = typeof en;
export type ToolSearchAliases = Record<string, { title?: string; description?: string }>;

const EN_TOOL_SEARCH_ALIASES: ToolSearchAliases = Object.fromEntries(
    Object.entries(en.tools as Record<string, { title?: string; description?: string }>).map(([toolKey, value]) => [
        toolKey,
        {
            title: value.title,
            description: value.description,
        },
    ]),
);

export const TRANSLATIONS: Record<Locale, TranslationSchema> = {
    en,
    "zh-CN": zhCN,
    "zh-TW": zhTW,
    ja,
    ko,
    de,
    fr,
};

export function getTranslation(lang: Locale): TranslationSchema {
    return TRANSLATIONS[lang];
}

export function getEnglishToolSearchAliases(): ToolSearchAliases {
    return EN_TOOL_SEARCH_ALIASES;
}
