export type VerificationNetworkEntry = {
    id: number
    method: string
    host: string
    pathType: "same-origin" | "external"
    timestamp: string
}

export type VerificationStorageEntry = {
    id: number
    area: "localStorage" | "sessionStorage"
    operation: "setItem" | "removeItem" | "clear"
    key: string
    allowed: boolean
    timestamp: string
}

export const ALLOWED_STORAGE_KEY_PREFIXES = [
    "byteflow:",
    "theme",
] as const

export function isAllowedVerificationStorageKey(key: string): boolean {
    return ALLOWED_STORAGE_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(prefix))
}

export function sanitizeVerificationUrl(input: unknown, baseHref: string) {
    const rawUrl = typeof input === "string"
        ? input
        : input instanceof URL
            ? input.href
            : typeof Request !== "undefined" && input instanceof Request
                ? input.url
                : ""

    try {
        const url = new URL(rawUrl, baseHref)
        return {
            host: url.origin,
            pathType: url.origin === new URL(baseHref).origin ? "same-origin" as const : "external" as const,
        }
    } catch {
        return {
            host: "unknown",
            pathType: "external" as const,
        }
    }
}

export function getVerificationRequestMethod(input: unknown, init?: RequestInit) {
    if (init?.method) return init.method.toUpperCase()
    if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase()
    return "GET"
}

export function getToolSlugFromVerificationPathname(pathname: string): string | null {
    const segments = pathname.split("/").filter(Boolean)
    return segments.length >= 2 ? segments[1] : null
}
