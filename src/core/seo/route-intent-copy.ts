import type { Locale } from "@/core/i18n/i18n"
import { LOCALES } from "@/core/i18n/i18n"

export type RouteIntentType = "tool" | "hub" | "content"

const ROUTE_INTENT_COPY_BY_LOCALE: Record<Locale, Record<RouteIntentType, string>> = {
    en: {
        tool: "Run this tool instantly in your browser. No signup and no server-side processing.",
        hub: "Find the right workflow quickly: compare tools by task and open the best match in one click.",
        content: "Use this guide as an operational checklist, then run the linked tools to validate changes immediately.",
    },
    "zh-CN": {
        tool: "在浏览器中即时运行此工具，无需注册且无需服务端处理。",
        hub: "按任务快速筛选工具，一键进入更合适的处理流程。",
        content: "先按本文步骤排查，再用文中的工具快速验证结果。",
    },
    "zh-TW": {
        tool: "在瀏覽器中即時執行此工具，無需註冊且不需伺服器處理。",
        hub: "依任務快速篩選工具，一鍵進入更合適的處理流程。",
        content: "先依本文步驟排查，再用文中工具快速驗證結果。",
    },
    ja: {
        tool: "このツールはブラウザで即時実行できます。登録もサーバー処理も不要です。",
        hub: "目的に合わせてツールを素早く絞り込み、最適なフローへ進めます。",
        content: "まずこの記事の手順で切り分けし、関連ツールで結果をすぐ検証できます。",
    },
    ko: {
        tool: "이 도구는 브라우저에서 즉시 실행되며 가입이나 서버 처리 없이 사용할 수 있습니다.",
        hub: "작업 목적에 맞춰 도구를 빠르게 고르고 적합한 흐름으로 바로 이동하세요.",
        content: "먼저 이 가이드 순서대로 점검한 뒤, 연결된 도구로 결과를 바로 검증하세요.",
    },
    de: {
        tool: "Dieses Tool läuft sofort im Browser, ohne Registrierung und ohne Serververarbeitung.",
        hub: "Filtere Tools schnell nach Aufgabe und wechsle direkt in den passenden Ablauf.",
        content: "Arbeite die Schritte im Artikel durch und prüfe Ergebnisse direkt mit den verlinkten Tools.",
    },
    fr: {
        tool: "Cet outil s'exécute instantanément dans le navigateur, sans inscription ni traitement serveur.",
        hub: "Filtrez rapidement les outils selon la tâche et ouvrez le flux le plus adapté.",
        content: "Suivez d'abord les étapes du guide, puis vérifiez le résultat avec les outils liés.",
    },
}

const SUPPORTED_LOCALES = new Set<string>(LOCALES)

export function getRouteIntentCopy(locale: string | null, routeType: RouteIntentType): string | null {
    if (!locale || !SUPPORTED_LOCALES.has(locale)) return null
    return ROUTE_INTENT_COPY_BY_LOCALE[locale as Locale][routeType] || null
}
