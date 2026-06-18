export type ExternalUrlRejectReason =
    | "empty"
    | "invalid"
    | "unsupported_protocol"
    | "insecure_protocol"
    | "blocked_hostname"
    | "unsupported_extension"

export type SafeExternalUrlResult =
    | { ok: true; url: URL }
    | { ok: false; reason: ExternalUrlRejectReason }

export type SafeExternalUrlOptions = {
    requireHttps?: boolean
    addHttpsWhenMissing?: boolean
    allowedHostnames?: readonly string[]
    allowedHostnameSuffixes?: readonly string[]
    allowedPathExtensions?: readonly string[]
}

function normalizeHostname(hostname: string): string {
    return hostname.toLowerCase().replace(/\.$/, "")
}

function isAllowedHostname(hostname: string, options: SafeExternalUrlOptions): boolean {
    const normalized = normalizeHostname(hostname)
    const exactHosts = (options.allowedHostnames || []).map(normalizeHostname)
    if (exactHosts.includes(normalized)) return true

    return (options.allowedHostnameSuffixes || []).some((suffix) => {
        const normalizedSuffix = normalizeHostname(suffix)
        return normalized === normalizedSuffix || normalized.endsWith(`.${normalizedSuffix}`)
    })
}

function hasAllowedPathExtension(pathname: string, extensions: readonly string[]): boolean {
    const normalizedPath = pathname.toLowerCase()
    return extensions.some((extension) => {
        const normalizedExtension = extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`
        return normalizedPath.endsWith(normalizedExtension)
    })
}

export function parseSafeExternalUrl(rawInput: string, options: SafeExternalUrlOptions = {}): SafeExternalUrlResult {
    const value = rawInput.trim()
    if (!value) return { ok: false, reason: "empty" }

    const candidate = options.addHttpsWhenMissing && !/^[a-z][a-z0-9+.-]*:/i.test(value)
        ? `https://${value}`
        : value

    let url: URL
    try {
        url = new URL(candidate)
    } catch {
        return { ok: false, reason: "invalid" }
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return { ok: false, reason: "unsupported_protocol" }
    }
    if (options.requireHttps !== false && url.protocol !== "https:") {
        return { ok: false, reason: "insecure_protocol" }
    }
    if ((options.allowedHostnames?.length || options.allowedHostnameSuffixes?.length) && !isAllowedHostname(url.hostname, options)) {
        return { ok: false, reason: "blocked_hostname" }
    }
    if (options.allowedPathExtensions?.length && !hasAllowedPathExtension(url.pathname, options.allowedPathExtensions)) {
        return { ok: false, reason: "unsupported_extension" }
    }

    return { ok: true, url }
}

export function sanitizeDownloadFilename(rawFilename: string, fallback: string): string {
    const safe = rawFilename
        .trim()
        .replace(/[/\\?%*:|"<>]+/g, "-")
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/-+(\.[a-zA-Z0-9]{1,16})$/g, "$1")
        .replace(/^[.-]+|[.-]+$/g, "")
    return safe || fallback
}

export function openExternalUrl(rawInput: string): boolean {
    const parsed = parseSafeExternalUrl(rawInput, { requireHttps: true })
    if (!parsed.ok || typeof window === "undefined") return false

    const opened = window.open(parsed.url.toString(), "_blank", "noopener,noreferrer")
    if (opened) {
        opened.opener = null
    }
    return Boolean(opened)
}
