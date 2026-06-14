/**
 * Privacy-first analytics facade.
 *
 * Byteflow relies on Cloudflare Web Analytics at the hosting layer for
 * cookie-free page analytics. Runtime event hooks remain no-ops so UI code can
 * keep semantic instrumentation markers without sending tool usage data.
 */

type EventParams = Record<string, string | number | boolean | undefined>
type InteractionAnalyticsAction = "copy_output" | "download_output" | null
type SeoLandingParams = {
    locale: string
    routeType: string
    pagePath: string
}
type TrackPageView = (path: string) => void
type TrackToolUsage = (toolKey: string, action: string, params?: EventParams) => void
type TrackSeoLanding = (params: SeoLandingParams) => void
type TrackToolInteraction = (toolKey: string, trigger: string) => void
type TrackEvent = (category: string, action: string, label?: string, params?: EventParams) => void
type TrackCTA = (ctaName: string, action: "view" | "click" | "dismiss") => void

const COPY_SIGNAL_KEYWORDS = ["copy", "copier", "kopieren", "复制", "複製", "コピー", "복사"]
const DOWNLOAD_SIGNAL_KEYWORDS = ["download", "herunterladen", "telecharger", "télécharger", "下载", "下載", "ダウンロード", "다운로드"]

function normalizeInteractionSignal(signal: string): string {
    return signal
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
}

export const isAnalyticsEnabled = (): boolean => false
const noop = () => undefined

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

export const trackPageView: TrackPageView = noop
export const trackToolUsage: TrackToolUsage = noop
export const trackSeoLanding: TrackSeoLanding = noop
export const trackToolOpen: (toolKey: string) => void = noop
export const trackToolRun: TrackToolInteraction = noop
export const trackCopyOutput: TrackToolInteraction = noop
export const trackDownloadOutput: TrackToolInteraction = noop
export const trackEvent: TrackEvent = noop
export const trackCTA: TrackCTA = noop
