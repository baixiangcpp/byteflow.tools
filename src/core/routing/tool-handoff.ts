const HANDOFF_PARAM = "handoff"
const HANDOFF_REF_PARAM = "handoff_ref"

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
    void payload
    return basePath
}

export const buildToolHandoffHref = buildShareableToolHandoffHref

export function buildToolHandoffLink(lang: string, slug: string, payload: string): ToolHandoffLink {
    const basePath = buildBasePath(lang, slug)
    void payload
    return {
        href: basePath,
        prime: () => undefined,
    }
}

export function buildSensitiveToolHandoffLink(lang: string, slug: string): ToolHandoffLink {
    return {
        href: buildBasePath(lang, slug),
        prime: () => undefined,
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
    return null
}
