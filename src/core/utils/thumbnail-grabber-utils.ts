import { parseSafeExternalUrl } from "@/core/security/external-url"

export type ThumbnailCandidate = {
    label: string
    url: string
}

function parseUrl(input: string): URL | null {
    const parsed = parseSafeExternalUrl(input, {
        requireHttps: true,
        addHttpsWhenMissing: true,
        allowedHostnames: ["youtu.be"],
        allowedHostnameSuffixes: ["youtube.com", "youtube-nocookie.com", "vimeo.com"],
    })
    return parsed.ok ? parsed.url : null
}

export function parseYouTubeVideoId(input: string): string | null {
    const url = parseUrl(input)
    if (!url) return null

    const host = url.hostname.toLowerCase()
    const path = url.pathname

    if (host === "youtu.be") {
        const id = path.split("/").filter(Boolean)[0]
        return id || null
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
        const watchId = url.searchParams.get("v")
        if (watchId) return watchId

        const parts = path.split("/").filter(Boolean)
        if (parts.length >= 2 && ["embed", "shorts", "v"].includes(parts[0])) {
            return parts[1]
        }
    }

    return null
}

export function parseVimeoVideoId(input: string): string | null {
    const url = parseUrl(input)
    if (!url) return null

    const host = url.hostname.toLowerCase()
    if (!(host.endsWith("vimeo.com") || host.endsWith("player.vimeo.com"))) return null

    const segments = url.pathname.split("/").filter(Boolean)
    for (let i = segments.length - 1; i >= 0; i -= 1) {
        if (/^\d+$/.test(segments[i])) return segments[i]
    }

    return null
}

export function buildYouTubeThumbnailCandidates(videoId: string): ThumbnailCandidate[] {
    const safeId = videoId.trim()
    if (!safeId) return []

    const base = `https://i.ytimg.com/vi/${safeId}`
    return [
        { label: "maxres", url: `${base}/maxresdefault.jpg` },
        { label: "sd", url: `${base}/sddefault.jpg` },
        { label: "hq", url: `${base}/hqdefault.jpg` },
        { label: "mq", url: `${base}/mqdefault.jpg` },
        { label: "default", url: `${base}/default.jpg` },
    ]
}

export function buildVimeoThumbnailCandidates(videoId: string): ThumbnailCandidate[] {
    const safeId = videoId.trim()
    if (!safeId) return []

    const base = `https://vumbnail.com/${safeId}`
    return [
        { label: "large", url: `${base}_large.jpg` },
        { label: "medium", url: `${base}_medium.jpg` },
        { label: "small", url: `${base}_small.jpg` },
        { label: "default", url: `${base}.jpg` },
    ]
}

export async function probeFirstWorkingThumbnail(candidates: ThumbnailCandidate[]): Promise<ThumbnailCandidate | null> {
    const TIMEOUT_MS = 2500

    for (const candidate of candidates) {
        const ok = await new Promise<boolean>((resolve) => {
            const image = new Image()
            const timeout = window.setTimeout(() => resolve(false), TIMEOUT_MS)
            const done = (value: boolean) => {
                window.clearTimeout(timeout)
                resolve(value)
            }
            image.onload = () => done(true)
            image.onerror = () => done(false)
            image.src = candidate.url
        })
        if (ok) return candidate
    }
    return null
}
