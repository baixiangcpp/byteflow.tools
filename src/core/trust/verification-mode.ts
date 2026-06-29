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

export type VerificationStorageKeyPolicy = {
    exactKeys: readonly string[]
    safePrefixes: readonly string[]
    reviewSubstrings: readonly string[]
}

export const VERIFICATION_STORAGE_KEY_POLICY: VerificationStorageKeyPolicy = {
    exactKeys: [
        "theme",
        "byteflow:analytics:opt-out",
        "byteflow:tools:favorites",
        "byteflow:tools:recent",
        "byteflow:preferred-locale",
        "byteflow:pwa-install:visit-count",
        "byteflow:pwa-install:dismissed-until",
        "byteflow:pwa-install:session-prompted",
        "byteflow:pwa-install:installed",
        "byteflow:base64:mode",
        "byteflow:base64:operation",
        "byteflow:csv-json-converter:direction",
        "byteflow:csv-json-converter:delimiter",
        "byteflow:csv-json-converter:has-header",
        "byteflow:csv-json-converter:type-inference",
        "byteflow:json-formatter:view-mode",
        "byteflow:jwt-workbench:algorithm",
        "byteflow:pipeline-builder:onboarding-dismissed",
        "byteflow:url-encode-decode:strategy",
        "byteflow:url-encode-decode:operation",
        "byteflow:yaml-json-converter:mode",
        "byteflow:yaml-json-converter:from-format",
        "byteflow:yaml-json-converter:to-format",
    ],
    safePrefixes: [],
    reviewSubstrings: [
        "input",
        "output",
        "payload",
        "token",
        "jwt",
        "secret",
        "password",
        "file",
        "blob",
        "image",
        "log",
        "har",
        "request",
        "response",
        "body",
        "content",
    ],
} as const

const REVIEW_STORAGE_KEY_SUBSTRINGS = [
    ...VERIFICATION_STORAGE_KEY_POLICY.reviewSubstrings,
] as const

export function isAllowedVerificationStorageKey(key: string): boolean {
    const normalized = key.trim().toLowerCase()
    if (!normalized) return false
    if (REVIEW_STORAGE_KEY_SUBSTRINGS.some((substring) => normalized.includes(substring))) return false
    if (VERIFICATION_STORAGE_KEY_POLICY.exactKeys.some((allowedKey) => allowedKey.toLowerCase() === normalized)) return true
    return VERIFICATION_STORAGE_KEY_POLICY.safePrefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase()))
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
