import type { Metadata } from "next";
import type { Locale } from "@/core/i18n/i18n";
import { requireTranslationValue } from "@/core/i18n/i18n";
import { CATEGORIES, getToolBySlug, type ToolMeta } from "@/core/registry";
import { getTranslation } from "@/core/i18n/translations/catalog";
import { getLocalizedMetaCopy } from "@/core/seo/localized-meta-copy";
import { SITE_URL, buildCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls";
import { buildToolBreadcrumbJsonLd, buildWebsiteJsonLd } from "@/core/seo/jsonld";
import { getRouteIntentCopy as getLocalizedRouteIntentCopy, type RouteIntentType } from "./route-intent-copy";

const SITE_NAME = "byteflow.tools";
const SITE_TITLE_SUFFIX = ` | ${SITE_NAME}`;
const DEFAULT_OG_IMAGE = `${SITE_URL}/icon-512.png`;
const CONTENT_INTRO_EXCLUDE_SLUGS = new Set(["about", "pricing", "contact", "privacy", "trust-center", "terms"]);
const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
    en: "en_US",
    "zh-CN": "zh_CN",
    "zh-TW": "zh_TW",
    ja: "ja_JP",
    ko: "ko_KR",
    de: "de_DE",
    fr: "fr_FR",
};

type SeoRouteType = RouteIntentType;
type SeoKeywordRouteType = SeoRouteType | "site";

type SeoSnippetBoost = {
    titleSuffix?: string;
    descriptionSuffix?: string;
};

const SEO_SNIPPET_BOOSTS: Partial<Record<Locale, Partial<Record<SeoRouteType, SeoSnippetBoost>>>> = {
    en: {
        tool: {
            titleSuffix: " - Free Online",
            descriptionSuffix: " Run instantly in your browser with no signup.",
        },
        hub: {
            titleSuffix: " - Free Tool Hub",
            descriptionSuffix: " Compare practical tools and launch the right workflow in one click.",
        },
        content: {
            descriptionSuffix: " Includes checklists, examples, and production troubleshooting steps.",
        },
    },
    "zh-CN": {
        tool: {
            titleSuffix: " - 免费在线工具",
            descriptionSuffix: " 无需注册，浏览器本地即时处理。",
        },
        hub: {
            titleSuffix: " - 工具导航",
            descriptionSuffix: " 按场景快速选择工具并立即开始处理。",
        },
        content: {
            descriptionSuffix: " 包含检查清单、示例和生产环境排障步骤。",
        },
    },
    "zh-TW": {
        tool: {
            titleSuffix: " - 免費線上工具",
            descriptionSuffix: " 免註冊，瀏覽器本地即時處理。",
        },
        hub: {
            titleSuffix: " - 工具導航",
            descriptionSuffix: " 依情境快速比較工具並一鍵啟動流程。",
        },
        content: {
            descriptionSuffix: " 內含檢查清單、範例與正式環境排錯步驟。",
        },
    },
    ja: {
        tool: {
            titleSuffix: " - 無料オンラインツール",
            descriptionSuffix: " 登録不要でブラウザ内ですぐ実行できます。",
        },
        hub: {
            titleSuffix: " - 無料ツールハブ",
            descriptionSuffix: " 用途別に比較して最適なフローをすぐ開始できます。",
        },
        content: {
            descriptionSuffix: " チェックリスト、実例、本番トラブルシュート手順を含みます。",
        },
    },
    ko: {
        tool: {
            titleSuffix: " - 무료 온라인 도구",
            descriptionSuffix: " 회원가입 없이 브라우저에서 즉시 실행됩니다.",
        },
        hub: {
            titleSuffix: " - 무료 도구 허브",
            descriptionSuffix: " 작업별 도구를 빠르게 비교하고 바로 실행할 수 있습니다.",
        },
        content: {
            descriptionSuffix: " 체크리스트, 예시, 운영 환경 트러블슈팅 단계를 포함합니다.",
        },
    },
    de: {
        tool: {
            titleSuffix: " - Kostenlos online",
            descriptionSuffix: " Sofort im Browser nutzbar, ohne Anmeldung.",
        },
        hub: {
            titleSuffix: " - Kostenloser Tool-Hub",
            descriptionSuffix: " Vergleichen Sie Tools nach Aufgabe und starten Sie direkt den passenden Ablauf.",
        },
        content: {
            descriptionSuffix: " Enthält Checklisten, Beispiele und Schritte zur Fehlerbehebung in Produktion.",
        },
    },
    fr: {
        tool: {
            titleSuffix: " - Outil en ligne gratuit",
            descriptionSuffix: " Lancez-le instantanément dans le navigateur, sans inscription.",
        },
        hub: {
            titleSuffix: " - Hub d'outils gratuit",
            descriptionSuffix: " Comparez les outils par usage et ouvrez le bon flux en un clic.",
        },
        content: {
            descriptionSuffix: " Inclut checklists, exemples et étapes de diagnostic en production.",
        },
    },
};

const SEO_KEYWORD_PHRASES: Record<Locale, Record<SeoKeywordRouteType, string[]>> = {
    en: {
        site: ["developer tools", "privacy-first tools", "local browser tools"],
        tool: ["free online tool", "browser-based workflow", "local processing"],
        hub: ["tool hub", "developer workflow hub", "browser-based tools"],
        content: ["developer guide", "workflow checklist", "production troubleshooting"],
    },
    "zh-CN": {
        site: ["开发者工具", "隐私优先工具", "浏览器本地工具"],
        tool: ["免费在线工具", "浏览器本地处理", "隐私优先"],
        hub: ["工具导航", "开发者工具导航", "浏览器本地工具"],
        content: ["开发指南", "检查清单", "生产排障"],
    },
    "zh-TW": {
        site: ["開發者工具", "隱私優先工具", "瀏覽器本地工具"],
        tool: ["免費線上工具", "瀏覽器本地處理", "隱私優先"],
        hub: ["工具導航", "開發者工具導航", "瀏覽器本地工具"],
        content: ["開發指南", "檢查清單", "正式環境排錯"],
    },
    ja: {
        site: ["開発者ツール", "プライバシー重視ツール", "ブラウザ完結ツール"],
        tool: ["無料オンラインツール", "ブラウザ内処理", "ローカル処理"],
        hub: ["ツールハブ", "開発者ツール集", "ブラウザ完結ツール"],
        content: ["開発ガイド", "チェックリスト", "本番トラブルシュート"],
    },
    ko: {
        site: ["개발자 도구", "개인정보 우선 도구", "브라우저 로컬 도구"],
        tool: ["무료 온라인 도구", "브라우저 로컬 처리", "개인정보 우선"],
        hub: ["도구 허브", "개발자 워크플로", "브라우저 로컬 도구"],
        content: ["개발 가이드", "체크리스트", "운영 트러블슈팅"],
    },
    de: {
        site: ["Entwickler-Tools", "datenschutzfreundliche Tools", "Browser-Tools"],
        tool: ["kostenloses Online-Tool", "lokale Verarbeitung", "Browser-Workflow"],
        hub: ["Tool-Hub", "Entwickler-Workflow", "Browser-Tools"],
        content: ["Entwicklerleitfaden", "Checkliste", "Produktionstroubleshooting"],
    },
    fr: {
        site: ["outils developpeur", "outils respectueux de la vie privee", "outils navigateur"],
        tool: ["outil en ligne gratuit", "traitement local", "workflow navigateur"],
        hub: ["hub d'outils", "workflow developpeur", "outils navigateur"],
        content: ["guide developpeur", "checklist", "diagnostic production"],
    },
};

function appendIfMissing(base: string, suffix?: string): string {
    if (!suffix) return base;
    if (base.includes(suffix)) return base;
    return `${base}${suffix}`;
}

function titleIncludesSiteName(title: string) {
    return title.includes(SITE_NAME);
}

function buildPageTitle(title: string): Metadata["title"] {
    return titleIncludesSiteName(title) ? { absolute: title } : title;
}

function withSiteName(title: string) {
    return titleIncludesSiteName(title) ? title : `${title}${SITE_TITLE_SUFFIX}`;
}

export function getOgLocale(lang: Locale) {
    return OPEN_GRAPH_LOCALES[lang];
}

export { DEFAULT_OG_IMAGE };

function uniqueKeywords(values: string[]) {
    const seen = new Set<string>();
    const keywords: string[] = [];

    for (const rawValue of values) {
        const value = rawValue.trim();
        if (!value) continue;
        const normalized = value.toLocaleLowerCase();
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        keywords.push(value);
    }

    return keywords;
}

export function buildMetadataKeywords({
    lang,
    routeType,
    primaryTerm,
    secondaryTerms = [],
    fallbackKeywords = [],
}: {
    lang: Locale;
    routeType: SeoKeywordRouteType;
    primaryTerm: string;
    secondaryTerms?: string[];
    fallbackKeywords?: string[];
}) {
    if (lang === "en" && fallbackKeywords.length > 0) {
        return uniqueKeywords(fallbackKeywords);
    }

    return uniqueKeywords([
        primaryTerm,
        ...secondaryTerms,
        ...SEO_KEYWORD_PHRASES[lang][routeType],
        "byteflow.tools",
    ]);
}

export function buildSiteKeywords({
    lang,
    title,
}: {
    lang: Locale;
    title: string;
}) {
    return buildMetadataKeywords({
        lang,
        routeType: "site",
        primaryTerm: title,
    });
}

export function buildToolOgImageUrl(lang: Locale, slug: string) {
    return `${SITE_URL}/og/tools/${lang}/${slug}.jpg`;
}

export function applySeoSnippetAngle({
    lang,
    routeType,
    title,
    description,
}: {
    lang: Locale;
    routeType: SeoRouteType;
    title: string;
    description: string;
}) {
    const boost = SEO_SNIPPET_BOOSTS[lang]?.[routeType];
    return {
        title: appendIfMissing(title, boost?.titleSuffix),
        description: appendIfMissing(description, boost?.descriptionSuffix),
    };
}

export function getRouteIntentIntro({
    lang,
    routeType,
    slug,
}: {
    lang: Locale;
    routeType: SeoRouteType;
    slug: string | null;
}) {
    if (routeType === "content" && (slug == null || CONTENT_INTRO_EXCLUDE_SLUGS.has(slug))) {
        return null;
    }
    return getLocalizedRouteIntentCopy(lang, routeType);
}

/**
 * Get a localized tool title and description from the translation files.
 */
function getToolTranslation(lang: Locale, toolKey: string) {
    const t = getTranslation(lang);
    const tools = t.tools as Record<string, { title: string; description: string }>;
    const tool = tools[toolKey];
    return {
        title: requireTranslationValue(tool?.title, `tools.${toolKey}.title`),
        description: requireTranslationValue(tool?.description, `tools.${toolKey}.description`),
    };
}

function getNavTranslation(lang: Locale, navKey: string) {
    const t = getTranslation(lang);
    const nav = t.nav as Record<string, string>;
    return requireTranslationValue(nav[navKey], `nav.${navKey}`);
}

/**
 * Build full Next.js Metadata for a tool page.
 * Generates: unique title, description, canonical, hreflang alternates, openGraph, twitter.
 */
export function buildToolMetadata({
    lang,
    slug,
}: {
    lang: Locale;
    slug: string;
}): Metadata {
    const tool = getToolBySlug(slug);
    if (!tool) {
        return { title: slug };
    }

    const base = getToolTranslation(lang, tool.key);
    const { title, description } = applySeoSnippetAngle({
        lang,
        routeType: "tool",
        title: base.title,
        description: base.description,
    });
    const canonicalUrl = buildCanonicalUrl(lang, slug);

    // Build hreflang alternates for all locales + x-default
    const languages = buildLocalizedAlternates({ slug });
    const ogLocale = getOgLocale(lang);
    const categoryTitle = getNavTranslation(lang, CATEGORIES[tool.category].labelKey);
    const ogImage = buildToolOgImageUrl(lang, slug);

    return {
        title: buildPageTitle(title),
        description,
        keywords: buildMetadataKeywords({
            lang,
            routeType: "tool",
            primaryTerm: base.title,
            secondaryTerms: [categoryTitle],
            fallbackKeywords: tool.keywords,
        }),
        alternates: {
            canonical: canonicalUrl,
            languages,
        },
        openGraph: {
            title: withSiteName(title),
            description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            locale: ogLocale,
            type: "website",
            images: [ogImage],
        },
        twitter: {
            card: "summary_large_image",
            title: withSiteName(title),
            description,
            images: [ogImage],
        },
    };
}

export function buildHubMetadata({
    lang,
    slug,
    title,
    description,
}: {
    lang: Locale;
    slug: string;
    title: string;
    description: string;
}): Metadata {
    const boosted = applySeoSnippetAngle({ lang, routeType: "hub", title, description });
    const canonicalUrl = buildCanonicalUrl(lang, slug);

    return {
        title: buildPageTitle(boosted.title),
        description: boosted.description,
        keywords: buildMetadataKeywords({
            lang,
            routeType: "hub",
            primaryTerm: title,
        }),
        alternates: {
            canonical: canonicalUrl,
            languages: buildLocalizedAlternates({ slug }),
        },
        openGraph: {
            title: withSiteName(boosted.title),
            description: boosted.description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            locale: getOgLocale(lang),
            type: "website",
            images: [DEFAULT_OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title: withSiteName(boosted.title),
            description: boosted.description,
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

export function buildContentMetadata({
    lang,
    slug,
    title,
    description,
}: {
    lang: Locale;
    slug: string;
    title: string;
    description: string;
}): Metadata {
    const localized = getLocalizedMetaCopy({
        slug,
        locale: lang,
        fallbackTitle: title,
        fallbackDescription: description,
    });
    const boosted = applySeoSnippetAngle({
        lang,
        routeType: "content",
        title: localized.title,
        description: localized.description,
    });
    const canonicalUrl = buildCanonicalUrl(lang, slug);

    return {
        title: buildPageTitle(boosted.title),
        description: boosted.description,
        keywords: buildMetadataKeywords({
            lang,
            routeType: "content",
            primaryTerm: localized.title,
        }),
        alternates: {
            canonical: canonicalUrl,
            languages: buildLocalizedAlternates({ slug }),
        },
        openGraph: {
            title: withSiteName(boosted.title),
            description: boosted.description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            locale: getOgLocale(lang),
            type: "article",
            images: [DEFAULT_OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title: withSiteName(boosted.title),
            description: boosted.description,
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

export function buildStaticPageMetadata({
    lang,
    slug,
    title,
    description,
    noindex = false,
}: {
    lang: Locale;
    slug: string;
    title: string;
    description: string;
    noindex?: boolean;
}): Metadata {
    const canonicalUrl = buildCanonicalUrl(lang, slug);
    const languages = buildLocalizedAlternates({ slug });

    return {
        title: buildPageTitle(title),
        description,
        keywords: buildMetadataKeywords({
            lang,
            routeType: "site",
            primaryTerm: title,
        }),
        robots: noindex
            ? {
                  index: false,
                  follow: true,
              }
            : undefined,
        alternates: {
            canonical: canonicalUrl,
            languages,
        },
        openGraph: {
            title: withSiteName(title),
            description,
            url: canonicalUrl,
            siteName: SITE_NAME,
            locale: getOgLocale(lang),
            type: "website",
            images: [DEFAULT_OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title: withSiteName(title),
            description,
            images: [DEFAULT_OG_IMAGE],
        },
    };
}

/**
 * Generate BreadcrumbList JSON-LD for a tool page.
 * Home -> Category -> Tool
 */
export function buildBreadcrumbJsonLd({
    lang,
    tool,
}: {
    lang: Locale;
    tool: ToolMeta;
}) {
    return buildToolBreadcrumbJsonLd({ lang, tool });
}

/**
 * Generate site-level JSON-LD (Organization + WebSite) for the homepage.
 */
export function buildSiteJsonLd(lang: Locale) {
    return buildWebsiteJsonLd(lang);
}
