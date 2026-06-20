import { buildCssFilterString, type ImageFilterConfig } from "@/core/utils/image-edit-utils"
import { parseSafeExternalUrl, sanitizeDownloadFilename } from "@/core/security/external-url"

export type InstagramFilterPreset = {
    id: string
    label: string
    config: ImageFilterConfig
    overlayColor: string
    overlayAlpha: number
}

export const INSTAGRAM_FILTER_PRESETS: InstagramFilterPreset[] = [
    {
        id: "normal",
        label: "Normal",
        config: { brightness: 100, contrast: 100, saturation: 100, grayscale: 0, blur: 0 },
        overlayColor: "#000000",
        overlayAlpha: 0,
    },
    {
        id: "clarendon",
        label: "Clarendon",
        config: { brightness: 108, contrast: 126, saturation: 132, grayscale: 0, blur: 0 },
        overlayColor: "#1275d0",
        overlayAlpha: 0.1,
    },
    {
        id: "gingham",
        label: "Gingham",
        config: { brightness: 106, contrast: 92, saturation: 86, grayscale: 8, blur: 0 },
        overlayColor: "#d9b38c",
        overlayAlpha: 0.1,
    },
    {
        id: "moon",
        label: "Moon",
        config: { brightness: 104, contrast: 108, saturation: 0, grayscale: 28, blur: 0 },
        overlayColor: "#000000",
        overlayAlpha: 0.08,
    },
    {
        id: "lark",
        label: "Lark",
        config: { brightness: 112, contrast: 96, saturation: 118, grayscale: 0, blur: 0 },
        overlayColor: "#f4b95e",
        overlayAlpha: 0.08,
    },
    {
        id: "reyes",
        label: "Reyes",
        config: { brightness: 108, contrast: 88, saturation: 92, grayscale: 6, blur: 0 },
        overlayColor: "#fbead4",
        overlayAlpha: 0.12,
    },
    {
        id: "juno",
        label: "Juno",
        config: { brightness: 112, contrast: 118, saturation: 150, grayscale: 0, blur: 0 },
        overlayColor: "#ff9a44",
        overlayAlpha: 0.08,
    },
]

const PRESET_BY_ID = new Map(INSTAGRAM_FILTER_PRESETS.map((preset) => [preset.id, preset]))

const IMAGE_EXTENSION_RE = /\.(avif|bmp|gif|jpeg|jpg|png|webp)$/i
const INSTAGRAM_ALLOWED_HOSTNAME_SUFFIXES = ["instagram.com"]

export type InstagramInputKind = "direct_image" | "instagram_post" | "unsupported"

export type ParsedInstagramInput = {
    raw: string
    normalizedUrl: string
    hostname: string
    pathname: string
    isHttps: boolean
    kind: InstagramInputKind
}

export function getInstagramFilterPreset(id: string): InstagramFilterPreset {
    return PRESET_BY_ID.get(id) || INSTAGRAM_FILTER_PRESETS[0]
}

export function getInstagramFilterCss(id: string): string {
    return buildCssFilterString(getInstagramFilterPreset(id).config)
}

export function parseInstagramMediaInput(rawInput: string): ParsedInstagramInput | null {
    const trimmed = rawInput.trim()
    if (!trimmed) return null

    const safeUrl = parseSafeExternalUrl(trimmed, {
        requireHttps: false,
        allowedHostnameSuffixes: INSTAGRAM_ALLOWED_HOSTNAME_SUFFIXES,
    })
    if (!safeUrl.ok) {
        return null
    }
    const parsed = safeUrl.url

    const hostname = parsed.hostname.toLowerCase()
    const pathname = parsed.pathname || "/"
    const isHttps = parsed.protocol === "https:"
    const isInstagramHost = hostname === "instagram.com" || hostname.endsWith(".instagram.com")
    const isPostUrl = /^\/(p|reel|tv|stories)\//i.test(pathname)
    const isDirectImage = IMAGE_EXTENSION_RE.test(pathname)

    let kind: InstagramInputKind = "unsupported"
    if (isDirectImage) {
        kind = "direct_image"
    } else if (isInstagramHost && isPostUrl) {
        kind = "instagram_post"
    }

    return {
        raw: trimmed,
        normalizedUrl: parsed.toString(),
        hostname,
        pathname,
        isHttps,
        kind,
    }
}

export function canDownloadAuthorizedInstagramMedia(parsed: ParsedInstagramInput | null, hasRightsConfirmed: boolean): boolean {
    if (!parsed) return false
    return parsed.kind === "direct_image" && parsed.isHttps && hasRightsConfirmed
}

export function getInstagramMediaFilename(rawUrl: string, fallback = "instagram-photo.jpg"): string {
    const parsed = parseSafeExternalUrl(rawUrl, { requireHttps: false })
    if (!parsed.ok) {
        return fallback
    }
    let lastSegment: string
    try {
        lastSegment = decodeURIComponent(parsed.url.pathname.split("/").filter(Boolean).pop() || "")
    } catch {
        return fallback
    }
    if (!lastSegment) return fallback
    return sanitizeDownloadFilename(lastSegment, fallback)
}
