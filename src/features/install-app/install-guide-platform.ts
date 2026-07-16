import type { GuidePlatform } from "@/core/utils/install-app-copy"

export type InstallGuidePlatformSignals = {
    maxTouchPoints?: number
    platform?: string
    userAgent?: string
}

export function detectInstallGuidePlatform({
    maxTouchPoints = 0,
    platform = "",
    userAgent = "",
}: InstallGuidePlatformSignals): GuidePlatform {
    const normalizedUserAgent = userAgent.toLowerCase()
    const normalizedPlatform = platform.toLowerCase()
    const isIPadOs = normalizedPlatform === "macintel" && maxTouchPoints > 1

    // The Android guide explicitly directs non-Chrome browsers to switch to Chrome.
    if (normalizedUserAgent.includes("android")) return "android"
    if (/iphone|ipad|ipod/.test(normalizedUserAgent) || isIPadOs) return "ios"
    if (/edg(?:e|a|ios)?\//.test(normalizedUserAgent)) return "edge"
    if (/firefox\/|fxios\//.test(normalizedUserAgent)) return "firefox"

    const isSafari = normalizedUserAgent.includes("safari")
        && !/chrome|chromium|crios|edg|opr\//.test(normalizedUserAgent)
    if (isSafari) return "safari_desktop"

    return "chrome_desktop"
}
