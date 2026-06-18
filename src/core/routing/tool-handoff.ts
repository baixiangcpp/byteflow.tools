const HANDOFF_PARAM = "handoff"
const HANDOFF_REF_PARAM = "handoff_ref"
const HANDOFF_STORAGE_PREFIX = "byteflow:handoff:"
const STORAGE_PROBE_KEY = `${HANDOFF_STORAGE_PREFIX}probe`

let sessionStorageAvailable: boolean | null = null

type ToolHandoffLink = {
    href: string
    prime: () => void
}

function buildBasePath(lang: string, slug: string): string {
    const normalizedLang = lang.trim()
    if (!normalizedLang) {
        throw new Error("[i18n] tool handoff requires an explicit locale")
    }
    return `/${normalizedLang}/${slug}`
}

function toBase64Url(value: string): string {
    const bytes = new TextEncoder().encode(value)
    let binary = ""
    for (let i = 0; i < bytes.length; i += 1) {
        binary += String.fromCharCode(bytes[i])
    }

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "")
}

function fromBase64Url(value: string): string | null {
    const normalized = value
        .replace(/-/g, "+")
        .replace(/_/g, "/")
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)

    try {
        const binary = atob(padded)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i)
        }
        return new TextDecoder().decode(bytes)
    } catch {
        return null
    }
}

export function buildShareableToolHandoffHref(lang: string, slug: string, payload: string): string {
    const basePath = buildBasePath(lang, slug)
    const text = payload.trim()
    if (!text) return basePath

    const encoded = toBase64Url(text)
    return `${basePath}#${HANDOFF_PARAM}=${encodeURIComponent(encoded)}`
}

export const buildToolHandoffHref = buildShareableToolHandoffHref

function canUseSessionStorage(): boolean {
    if (sessionStorageAvailable !== null) return sessionStorageAvailable
    if (typeof window === "undefined") {
        sessionStorageAvailable = false
        return sessionStorageAvailable
    }

    try {
        window.sessionStorage.setItem(STORAGE_PROBE_KEY, "1")
        window.sessionStorage.removeItem(STORAGE_PROBE_KEY)
        sessionStorageAvailable = true
    } catch {
        sessionStorageAvailable = false
    }
    return sessionStorageAvailable
}

function createHandoffRef(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function storeHandoffPayload(handoffRef: string, payload: string): void {
    if (!canUseSessionStorage()) return
    try {
        window.sessionStorage.setItem(`${HANDOFF_STORAGE_PREFIX}${handoffRef}`, payload)
    } catch {
        // Ignore write failures and rely on query-string fallback callers.
    }
}

function readHandoffPayload(handoffRef: string): string | null {
    if (!canUseSessionStorage()) return null
    try {
        const key = `${HANDOFF_STORAGE_PREFIX}${handoffRef}`
        const value = window.sessionStorage.getItem(key)
        if (value !== null) {
            window.sessionStorage.removeItem(key)
        }
        return value
    } catch {
        return null
    }
}

export function buildToolHandoffLink(lang: string, slug: string, payload: string): ToolHandoffLink {
    const basePath = buildBasePath(lang, slug)
    const text = payload.trim()
    if (!text) {
        return {
            href: basePath,
            prime: () => undefined,
        }
    }

    if (!canUseSessionStorage()) {
        return {
            href: buildShareableToolHandoffHref(lang, slug, text),
            prime: () => undefined,
        }
    }

    const handoffRef = createHandoffRef()
    return {
        href: `${basePath}#${HANDOFF_REF_PARAM}=${encodeURIComponent(handoffRef)}`,
        prime: () => storeHandoffPayload(handoffRef, text),
    }
}

function normalizeFragmentParams(fragment?: string): URLSearchParams {
    if (!fragment) return new URLSearchParams()
    const normalized = fragment.startsWith("#") ? fragment.slice(1) : fragment
    return new URLSearchParams(normalized)
}

export function getToolHandoffFromSearchParams(searchParams: URLSearchParams, fragment?: string): string | null {
    const fragmentParams = normalizeFragmentParams(fragment)
    const raw = fragmentParams.get(HANDOFF_PARAM) ?? searchParams.get(HANDOFF_PARAM)
    if (raw) return fromBase64Url(raw)

    const handoffRef = fragmentParams.get(HANDOFF_REF_PARAM) ?? searchParams.get(HANDOFF_REF_PARAM)
    if (!handoffRef) return null
    return readHandoffPayload(handoffRef)
}
