import type { Metadata } from "next"
import type { Locale } from "@/core/i18n/i18n"
import { buildCanonicalUrl, buildLocalizedAlternates } from "@/core/seo/urls"

type LegacyToolRedirectCopy = {
    title: string
    description: string
    heading: string
    body: string
    cta: string
    keywords: string[]
}

const LEGACY_TOOL_REDIRECT_COPY: Record<Locale, LegacyToolRedirectCopy> = {
    en: {
        title: "Redirecting…",
        description: "This legacy URL has moved to the current tool page.",
        heading: "Redirecting…",
        body: "This legacy URL has moved.",
        cta: "Continue to the current page",
        keywords: ["legacy URL redirect", "moved page", "byteflow.tools"],
    },
    "zh-CN": {
        title: "正在跳转…",
        description: "这个旧地址已迁移到当前工具页面。",
        heading: "正在跳转…",
        body: "这个旧地址已经迁移。",
        cta: "继续前往当前页面",
        keywords: ["旧地址跳转", "页面已迁移", "byteflow.tools"],
    },
    "zh-TW": {
        title: "重新導向中…",
        description: "這個舊網址已移轉到目前的工具頁面。",
        heading: "重新導向中…",
        body: "這個舊網址已經移轉。",
        cta: "前往目前頁面",
        keywords: ["舊網址重新導向", "頁面已移轉", "byteflow.tools"],
    },
    ja: {
        title: "リダイレクト中…",
        description: "この旧URLは現在のツールページへ移動しました。",
        heading: "リダイレクト中…",
        body: "この旧URLは移動しました。",
        cta: "現在のページへ進む",
        keywords: ["旧URL リダイレクト", "移動したページ", "byteflow.tools"],
    },
    ko: {
        title: "이동 중…",
        description: "이 예전 URL은 현재 도구 페이지로 이동되었습니다.",
        heading: "이동 중…",
        body: "이 예전 URL은 이동되었습니다.",
        cta: "현재 페이지로 이동",
        keywords: ["이전 URL 리디렉션", "이동된 페이지", "byteflow.tools"],
    },
    de: {
        title: "Weiterleitung…",
        description: "Diese alte URL wurde zur aktuellen Tool-Seite verschoben.",
        heading: "Weiterleitung…",
        body: "Diese alte URL wurde verschoben.",
        cta: "Zur aktuellen Seite wechseln",
        keywords: ["Weiterleitung alte URL", "verschobene Seite", "byteflow.tools"],
    },
    fr: {
        title: "Redirection…",
        description: "Cette ancienne URL a été déplacée vers la page d’outil actuelle.",
        heading: "Redirection…",
        body: "Cette ancienne URL a été déplacée.",
        cta: "Continuer vers la page actuelle",
        keywords: ["redirection ancienne URL", "page déplacée", "byteflow.tools"],
    },
}

export function getLegacyToolRedirectCopy(lang: Locale): LegacyToolRedirectCopy {
    return LEGACY_TOOL_REDIRECT_COPY[lang]
}

export function buildLegacyToolRedirectMetadata(lang: Locale, canonicalSlug: string): Metadata {
    const copy = getLegacyToolRedirectCopy(lang)

    return {
        title: copy.title,
        description: copy.description,
        keywords: copy.keywords,
        robots: {
            index: false,
            follow: true,
        },
        alternates: {
            canonical: buildCanonicalUrl(lang, canonicalSlug),
            languages: buildLocalizedAlternates({ slug: canonicalSlug }),
        },
    }
}
