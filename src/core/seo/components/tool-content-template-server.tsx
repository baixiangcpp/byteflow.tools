import type { Locale } from "@/core/i18n/i18n"
import { getTranslation } from "@/core/i18n/translations/catalog"
import {
    buildToolTemplateModel,
    SEO_CONTENT_TEMPLATE_LOCALES,
    ToolContentTemplateSection,
} from "./tool-content-template-modules/core"
import { EN_FALLBACK_PACK } from "./tool-content-template-modules/packs/en"
import { ZH_CN_FALLBACK_PACK } from "./tool-content-template-modules/packs/zh-cn"
import { ZH_TW_FALLBACK_PACK } from "./tool-content-template-modules/packs/zh-tw"
import { JA_FALLBACK_PACK } from "./tool-content-template-modules/packs/ja"
import { KO_FALLBACK_PACK } from "./tool-content-template-modules/packs/ko"
import { DE_FALLBACK_PACK } from "./tool-content-template-modules/packs/de"
import { FR_FALLBACK_PACK } from "./tool-content-template-modules/packs/fr"
import { TOP_TOOL_CONTENT_TEMPLATES } from "./tool-content-template-modules/top-templates"
import type { FallbackLocalePack, ToolContentTemplateEntry } from "./tool-content-template-modules/types"
import zhCnLocalizedTemplates from "./tool-content-template-modules/generated/zh-CN.json"
import zhTwLocalizedTemplates from "./tool-content-template-modules/generated/zh-TW.json"
import jaLocalizedTemplates from "./tool-content-template-modules/generated/ja.json"
import koLocalizedTemplates from "./tool-content-template-modules/generated/ko.json"
import deLocalizedTemplates from "./tool-content-template-modules/generated/de.json"
import frLocalizedTemplates from "./tool-content-template-modules/generated/fr.json"

const PACK_BY_LOCALE: Record<Locale, FallbackLocalePack> = {
    en: EN_FALLBACK_PACK,
    "zh-CN": ZH_CN_FALLBACK_PACK,
    "zh-TW": ZH_TW_FALLBACK_PACK,
    ja: JA_FALLBACK_PACK,
    ko: KO_FALLBACK_PACK,
    de: DE_FALLBACK_PACK,
    fr: FR_FALLBACK_PACK,
}

const LOCALIZED_TEMPLATES_BY_LOCALE: Partial<Record<Locale, Record<string, ToolContentTemplateEntry>>> = {
    "zh-CN": zhCnLocalizedTemplates as Record<string, ToolContentTemplateEntry>,
    "zh-TW": zhTwLocalizedTemplates as Record<string, ToolContentTemplateEntry>,
    ja: jaLocalizedTemplates as Record<string, ToolContentTemplateEntry>,
    ko: koLocalizedTemplates as Record<string, ToolContentTemplateEntry>,
    de: deLocalizedTemplates as Record<string, ToolContentTemplateEntry>,
    fr: frLocalizedTemplates as Record<string, ToolContentTemplateEntry>,
}

export function ToolContentTemplateServer({ toolSlug, lang }: { toolSlug: string; lang: Locale }) {
    if (!SEO_CONTENT_TEMPLATE_LOCALES.has(lang)) return null

    const model = buildToolTemplateModel({
        toolSlug,
        lang,
        t: getTranslation(lang) as Record<string, unknown>,
        pack: PACK_BY_LOCALE[lang],
        topTemplates: lang === "en" ? TOP_TOOL_CONTENT_TEMPLATES : undefined,
        localizedTemplates: LOCALIZED_TEMPLATES_BY_LOCALE[lang],
    })

    if (!model) return null
    return <ToolContentTemplateSection model={model} source="server" />
}
