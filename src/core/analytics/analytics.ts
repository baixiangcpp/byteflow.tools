/**
 * Privacy-first analytics facade.
 *
 * Runtime hooks are intentionally no-ops unless a future provider is wired
 * behind this allowlisted taxonomy. The API only accepts safe event names and
 * coarse parameters, so callers cannot pass tool input, output, raw URLs,
 * filenames, tokens, secrets, or search query text.
 */

import taxonomy from "./taxonomy.json"

type AnalyticsTaxonomy = typeof taxonomy
type AnalyticsEventName = keyof AnalyticsTaxonomy["events"]
type AnalyticsParamName = AnalyticsTaxonomy["allowedParams"][number]
type SizeBucket = AnalyticsTaxonomy["sizeBuckets"][number]
type QueryLengthBucket = AnalyticsTaxonomy["queryLengthBuckets"][number]
type AnalyticsValue = string | number | boolean | undefined
type AnalyticsPayload = Partial<Record<AnalyticsParamName, AnalyticsValue>>
type InteractionAnalyticsAction = "copy_output" | "download_output" | null
type ToolInteractionTrigger =
    | "ui_click_fallback"
    | "format"
    | "minify"
    | "validate"
    | "convert"
    | "generate"
    | "decode"
    | "encode"
    | "hash"
    | "run"
    | "copy"
    | "download"
    | "handoff"
    | "other"
    | string

const COPY_SIGNAL_KEYWORDS = ["copy", "copier", "kopieren", "复制", "複製", "コピー", "복사"]
const DOWNLOAD_SIGNAL_KEYWORDS = ["download", "herunterladen", "telecharger", "télécharger", "下载", "下載", "ダウンロード", "다운로드"]
const KNOWN_ACTION_KEYWORDS = [
    "format",
    "minify",
    "validate",
    "convert",
    "generate",
    "decode",
    "encode",
    "hash",
    "run",
    "copy",
    "download",
    "handoff",
]

function normalizeInteractionSignal(signal: string): string {
    return signal
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
}

function normalizeActionType(action: ToolInteractionTrigger): string {
    const normalized = normalizeInteractionSignal(action).replace(/[^a-z0-9_:-]+/g, "_")
    if (!normalized) return "other"
    if (normalized.startsWith("to_") || normalized.includes("handoff")) return "handoff"
    const keyword = KNOWN_ACTION_KEYWORDS.find((item) => normalized.includes(item))
    return keyword ?? "other"
}

function bucketSize(value: number | undefined): SizeBucket {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "unknown"
    if (value === 0) return "empty"
    if (value <= 1_024) return "tiny"
    if (value <= 64_000) return "small"
    if (value <= 1_000_000) return "medium"
    if (value <= 10_000_000) return "large"
    return "huge"
}

function bucketQueryLength(value: number): QueryLengthBucket {
    if (!Number.isFinite(value) || value <= 0) return "empty"
    if (value <= 3) return "short"
    if (value <= 24) return "medium"
    if (value <= 80) return "long"
    return "very_long"
}

function safeLocale(language?: string | null): string | undefined {
    if (!language) return undefined
    return language.replace(/[^A-Za-z-]/g, "").slice(0, 12) || undefined
}

function safeIdentifier(value?: string | null): string | undefined {
    if (!value) return undefined
    return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 96) || undefined
}

function safeSourcePage(value?: string | null): string | undefined {
    if (!value) return undefined
    return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64) || undefined
}

export const isAnalyticsEnabled = (): boolean => false

export function detectInteractionAnalyticsAction(
    signal: string,
    options: { hasDownloadAttribute?: boolean } = {},
): InteractionAnalyticsAction {
    const normalized = normalizeInteractionSignal(signal)
    if (!normalized) return null

    if (COPY_SIGNAL_KEYWORDS.some((keyword) => normalized.includes(normalizeInteractionSignal(keyword)))) {
        return "copy_output"
    }

    if (
        options.hasDownloadAttribute ||
        normalized === "png" ||
        normalized === "svg" ||
        DOWNLOAD_SIGNAL_KEYWORDS.some((keyword) => normalized.includes(normalizeInteractionSignal(keyword)))
    ) {
        return "download_output"
    }

    return null
}

export function buildAnalyticsPayload(event: AnalyticsEventName, params: AnalyticsPayload = {}) {
    const allowedParams = new Set<string>(taxonomy.events[event].allowedParams)
    return Object.fromEntries(
        Object.entries(params).filter(([key, value]) => allowedParams.has(key) && value !== undefined),
    ) as AnalyticsPayload
}

export function trackAllowlistedEvent(_event: AnalyticsEventName, _params: AnalyticsPayload = {}): void {
    // No-op by design. Future providers must call buildAnalyticsPayload first.
    void _event
    void _params
}

export function trackToolOpen(toolKey: string, language?: string | null, sourcePage?: string | null): void {
    trackAllowlistedEvent("tool_loaded", buildAnalyticsPayload("tool_loaded", {
        tool_id: safeIdentifier(toolKey),
        language: safeLocale(language),
        source_page: safeSourcePage(sourcePage),
    }))
}

export function trackToolRun(
    toolKey: string,
    action: ToolInteractionTrigger,
    options: { language?: string | null; inputSize?: number; sourcePage?: string | null } = {},
): void {
    trackAllowlistedEvent("tool_action", buildAnalyticsPayload("tool_action", {
        tool_id: safeIdentifier(toolKey),
        action_type: normalizeActionType(action),
        language: safeLocale(options.language),
        input_size_bucket: bucketSize(options.inputSize),
        source_page: safeSourcePage(options.sourcePage),
    }))
}

export function trackCopyOutput(toolKey: string, trigger: ToolInteractionTrigger, language?: string | null): void {
    trackAllowlistedEvent("copy_output", buildAnalyticsPayload("copy_output", {
        tool_id: safeIdentifier(toolKey),
        action_type: normalizeActionType(trigger),
        language: safeLocale(language),
    }))
}

export function trackDownloadOutput(
    toolKey: string,
    trigger: ToolInteractionTrigger,
    options: { language?: string | null; size?: number; sourcePage?: string | null } = {},
): void {
    trackAllowlistedEvent("download_output", buildAnalyticsPayload("download_output", {
        tool_id: safeIdentifier(toolKey),
        action_type: normalizeActionType(trigger),
        language: safeLocale(options.language),
        size_bucket: bucketSize(options.size),
        source_page: safeSourcePage(options.sourcePage),
    }))
}

export function trackSearchPerformed(params: {
    language?: string | null
    queryLength: number
    resultsCount: number
    sourcePage?: string | null
}): void {
    trackAllowlistedEvent("search_performed", buildAnalyticsPayload("search_performed", {
        language: safeLocale(params.language),
        query_length_bucket: bucketQueryLength(params.queryLength),
        results_count: Math.max(0, Math.trunc(params.resultsCount)),
        source_page: safeSourcePage(params.sourcePage),
    }))
}

export function trackRelatedToolClick(params: {
    toolKey: string
    relatedToolKey: string
    language?: string | null
    sourcePage?: string | null
}): void {
    trackAllowlistedEvent("related_tool_click", buildAnalyticsPayload("related_tool_click", {
        tool_id: safeIdentifier(params.toolKey),
        related_tool_id: safeIdentifier(params.relatedToolKey),
        language: safeLocale(params.language),
        source_page: safeSourcePage(params.sourcePage),
    }))
}

export function trackPwaInstalled(language?: string | null, platform?: string | null, sourcePage = "install_app"): void {
    trackAllowlistedEvent("pwa_installed", buildAnalyticsPayload("pwa_installed", {
        language: safeLocale(language),
        platform: safeIdentifier(platform),
        source_page: safeSourcePage(sourcePage),
    }))
}
