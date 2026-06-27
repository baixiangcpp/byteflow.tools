import type { Locale } from "@/core/i18n/i18n"
import { getTranslation, type TranslationSchema } from "@/core/i18n/translations/catalog"
import { getGrowthPage, type GrowthPageSlug } from "@/core/growth/growth-pages"
import {
    getLocalizedArticleDescription,
    getLocalizedArticleTitle,
    type LocalizedArticleSlug,
} from "@/core/seo/localized-articles"
import { getToolByKey } from "@/core/registry"
import { getTutorialLink } from "@/core/workflows/workflow-hubs"

export type GuideIndexItem = {
    slug: GrowthPageSlug | LocalizedArticleSlug
    source: "growth" | "article"
    category: "privacy" | "json" | "api" | "security" | "image" | "workflow"
    relatedToolKeys: string[]
    relatedRecipeSlugs: string[]
    safeExampleOnly: true
    title: string
    description: string
}

type GuideSeed = Omit<GuideIndexItem, "title" | "description">

const GUIDE_SEEDS: GuideSeed[] = [
    {
        slug: "how-to/decode-jwt-locally",
        source: "growth",
        category: "security",
        relatedToolKeys: ["jwt_decoder", "jwt_workbench", "jwt_verifier"],
        relatedRecipeSlugs: ["security-token-review"],
        safeExampleOnly: true,
    },
    {
        slug: "validate-json-before-api-requests",
        source: "article",
        category: "json",
        relatedToolKeys: ["json_formatter", "json_schema_workbench", "json_to_typescript"],
        relatedRecipeSlugs: ["api-payload-cleanup", "json-typescript-contract-review"],
        safeExampleOnly: true,
    },
    {
        slug: "json-schema-validation-checklist",
        source: "article",
        category: "json",
        relatedToolKeys: ["json_schema_workbench", "json_formatter", "json_diff_viewer"],
        relatedRecipeSlugs: ["api-payload-cleanup", "json-typescript-contract-review"],
        safeExampleOnly: true,
    },
    {
        slug: "openapi-debugging-workflow-checklist",
        source: "article",
        category: "api",
        relatedToolKeys: ["openapi_viewer", "openapi_mock", "http_request_builder", "curl_to_code"],
        relatedRecipeSlugs: ["api-payload-cleanup", "log-scrub-before-sharing"],
        safeExampleOnly: true,
    },
    {
        slug: "jwt-security-best-practices-for-token-handling",
        source: "article",
        category: "security",
        relatedToolKeys: ["jwt_decoder", "jwt_workbench", "jwt_verifier", "base64_encode_decode"],
        relatedRecipeSlugs: ["security-token-review"],
        safeExampleOnly: true,
    },
    {
        slug: "image-privacy-how-to-censor-and-protect-images",
        source: "article",
        category: "image",
        relatedToolKeys: ["image_privacy_workbench", "photo_censor", "image_resizer"],
        relatedRecipeSlugs: ["image-resize-social-export"],
        safeExampleOnly: true,
    },
]

const GUIDE_COPY_BY_LOCALE: Record<Locale, {
    hubLinkLabel: string
    hubSummary: string
    curatedGuides: string
    guideCategoryLabel: (category: GuideIndexItem["category"]) => string
    relatedRecipes: string
}> = {
    en: {
        hubLinkLabel: "How-to guides",
        hubSummary: "Task-based guides for local-first developer workflows, safe examples, and repeatable tool chains.",
        curatedGuides: "Curated guide library",
        guideCategoryLabel: (category) => ({
            privacy: "Privacy",
            json: "JSON",
            api: "API",
            security: "Security",
            image: "Image",
            workflow: "Workflow",
        })[category],
        relatedRecipes: "Related workflows",
    },
    "zh-CN": {
        hubLinkLabel: "操作指南",
        hubSummary: "面向本地优先开发工作流、安全示例和可重复工具链的任务型指南。",
        curatedGuides: "精选指南库",
        guideCategoryLabel: (category) => ({
            privacy: "隐私",
            json: "JSON",
            api: "API",
            security: "安全",
            image: "图片",
            workflow: "工作流",
        })[category],
        relatedRecipes: "相关工作流",
    },
    "zh-TW": {
        hubLinkLabel: "操作指南",
        hubSummary: "面向本地優先開發工作流、安全範例和可重複工具鏈的任務型指南。",
        curatedGuides: "精選指南庫",
        guideCategoryLabel: (category) => ({
            privacy: "隱私",
            json: "JSON",
            api: "API",
            security: "安全",
            image: "圖片",
            workflow: "工作流",
        })[category],
        relatedRecipes: "相關工作流",
    },
    ja: {
        hubLinkLabel: "手順ガイド",
        hubSummary: "ローカル優先の開発ワークフロー、安全な例、再利用できるツール連携のためのガイドです。",
        curatedGuides: "厳選ガイド",
        guideCategoryLabel: (category) => ({
            privacy: "プライバシー",
            json: "JSON",
            api: "API",
            security: "セキュリティ",
            image: "画像",
            workflow: "ワークフロー",
        })[category],
        relatedRecipes: "関連ワークフロー",
    },
    ko: {
        hubLinkLabel: "방법 가이드",
        hubSummary: "로컬 우선 개발 워크플로, 안전한 예시, 반복 가능한 도구 연결을 위한 작업별 가이드입니다.",
        curatedGuides: "엄선한 가이드",
        guideCategoryLabel: (category) => ({
            privacy: "개인정보",
            json: "JSON",
            api: "API",
            security: "보안",
            image: "이미지",
            workflow: "워크플로",
        })[category],
        relatedRecipes: "관련 워크플로",
    },
    de: {
        hubLinkLabel: "Anleitungen",
        hubSummary: "Aufgabenbezogene Guides fuer lokale Entwickler-Workflows, sichere Beispiele und wiederholbare Tool-Ketten.",
        curatedGuides: "Kuratierte Guides",
        guideCategoryLabel: (category) => ({
            privacy: "Datenschutz",
            json: "JSON",
            api: "API",
            security: "Sicherheit",
            image: "Bild",
            workflow: "Workflow",
        })[category],
        relatedRecipes: "Verwandte Workflows",
    },
    fr: {
        hubLinkLabel: "Guides pratiques",
        hubSummary: "Guides par tache pour workflows locaux, exemples surs et chaines d'outils repetables.",
        curatedGuides: "Guides selectionnes",
        guideCategoryLabel: (category) => ({
            privacy: "Confidentialite",
            json: "JSON",
            api: "API",
            security: "Securite",
            image: "Image",
            workflow: "Workflow",
        })[category],
        relatedRecipes: "Workflows associes",
    },
}

function isNonEnglishLocale(locale: Locale): locale is Exclude<Locale, "en"> {
    return locale !== "en"
}

function getToolTitle(t: TranslationSchema, toolKey: string) {
    const title = (t.tools as Record<string, { title?: string }>)[toolKey]?.title
    if (!title) throw new Error(`[guide-index] Missing title for related tool: ${toolKey}`)
    return title
}

function getGuideTitle(seed: GuideSeed, locale: Locale) {
    if (seed.source === "growth") {
        const page = getGrowthPage(seed.slug as GrowthPageSlug)
        if (!page) throw new Error(`[guide-index] Missing growth guide: ${seed.slug}`)
        return page.copy[locale].title
    }

    if (isNonEnglishLocale(locale)) {
        return getLocalizedArticleTitle(seed.slug as LocalizedArticleSlug, locale)
    }

    const link = getTutorialLink(seed.slug)
    if (!link) throw new Error(`[guide-index] Missing tutorial link: ${seed.slug}`)
    return link.title
}

function getGuideDescription(seed: GuideSeed, locale: Locale) {
    if (seed.source === "growth") {
        const page = getGrowthPage(seed.slug as GrowthPageSlug)
        if (!page) throw new Error(`[guide-index] Missing growth guide: ${seed.slug}`)
        return page.copy[locale].description
    }

    if (isNonEnglishLocale(locale)) {
        return getLocalizedArticleDescription(seed.slug as LocalizedArticleSlug, locale)
    }

    const link = getTutorialLink(seed.slug)
    if (!link) throw new Error(`[guide-index] Missing tutorial link: ${seed.slug}`)
    return link.description
}

export function getGuideIndexCopy(locale: Locale) {
    return GUIDE_COPY_BY_LOCALE[locale]
}

export function getGuideIndexItems(locale: Locale): GuideIndexItem[] {
    return GUIDE_SEEDS.map((seed) => ({
        ...seed,
        title: getGuideTitle(seed, locale),
        description: getGuideDescription(seed, locale),
    }))
}

export function getGuidesForTool(toolKey: string, locale: Locale) {
    return getGuideIndexItems(locale).filter((guide) => guide.relatedToolKeys.includes(toolKey))
}

export function getGuideRelatedTools(locale: Locale, guide: GuideIndexItem) {
    const t = getTranslation(locale)
    return guide.relatedToolKeys.map((toolKey) => {
        const tool = getToolByKey(toolKey)
        if (!tool) throw new Error(`[guide-index] Missing related tool: ${toolKey}`)
        return {
            key: toolKey,
            slug: tool.slug,
            title: getToolTitle(t, toolKey),
        }
    })
}

export function getPublishedGuideSlugs() {
    return GUIDE_SEEDS.map((guide) => guide.slug)
}
