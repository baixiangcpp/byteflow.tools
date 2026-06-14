export type DataUriInfo = {
    dataUri: string
    rawBase64: string
    mime: string
}

export type Base64ImageParseResult =
    | { ok: true; data: DataUriInfo }
    | { ok: false; reason: "empty" | "invalid_data_uri" | "invalid_base64_payload" }

export const DEFAULT_IMAGE_MIME = "image/png"

const BASE64_PAYLOAD_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
const SVG_XML_PATTERN = /<svg[\s>]/i

export function sanitizeBase64(input: string): string {
    return input.replace(/\s+/g, "")
}

function decodeBase64ToBytes(base64: string): Uint8Array | null {
    try {
        const decoded = globalThis.atob(base64)
        return Uint8Array.from(decoded, (char) => char.charCodeAt(0))
    } catch {
        return null
    }
}

function sniffImageMime(bytes: Uint8Array): string | null {
    if (bytes.length >= 8
        && bytes[0] === 0x89
        && bytes[1] === 0x50
        && bytes[2] === 0x4e
        && bytes[3] === 0x47
        && bytes[4] === 0x0d
        && bytes[5] === 0x0a
        && bytes[6] === 0x1a
        && bytes[7] === 0x0a) {
        return "image/png"
    }

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg"
    }

    if (bytes.length >= 6) {
        const header = String.fromCharCode(...bytes.slice(0, 6))
        if (header === "GIF87a" || header === "GIF89a") {
            return "image/gif"
        }
    }

    if (bytes.length >= 12) {
        const riff = String.fromCharCode(...bytes.slice(0, 4))
        const webp = String.fromCharCode(...bytes.slice(8, 12))
        if (riff === "RIFF" && webp === "WEBP") {
            return "image/webp"
        }
    }

    if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
        return "image/x-icon"
    }

    const decodedText = new TextDecoder().decode(bytes).trim()
    if (decodedText.startsWith("<?xml") || decodedText.startsWith("<svg") || SVG_XML_PATTERN.test(decodedText)) {
        return "image/svg+xml"
    }

    return null
}

function normalizeImagePayload(rawBase64: string): DataUriInfo | null {
    const sanitized = sanitizeBase64(rawBase64)
    if (!sanitized || !BASE64_PAYLOAD_PATTERN.test(sanitized)) {
        return null
    }

    const bytes = decodeBase64ToBytes(sanitized)
    if (!bytes) return null

    const sniffedMime = sniffImageMime(bytes)
    if (!sniffedMime) return null

    return {
        dataUri: `data:${sniffedMime};base64,${sanitized}`,
        rawBase64: sanitized,
        mime: sniffedMime,
    }
}

export function parseBase64Image(input: string): Base64ImageParseResult {
    const trimmed = input.trim()
    if (!trimmed) {
        return { ok: false, reason: "empty" }
    }

    if (trimmed.startsWith("data:")) {
        const match = trimmed.match(/^data:([^;,]+)(?:;[^,]*)?;base64,([\s\S]+)$/i)
        if (!match) {
            return { ok: false, reason: "invalid_data_uri" }
        }

        const normalized = normalizeImagePayload(match[2])
        if (!normalized) {
            return { ok: false, reason: "invalid_base64_payload" }
        }

        const declaredMime = match[1].trim().toLowerCase()
        const resolvedMime = declaredMime.startsWith("image/") ? declaredMime : normalized.mime

        return {
            ok: true,
            data: {
                dataUri: `data:${resolvedMime};base64,${normalized.rawBase64}`,
                rawBase64: normalized.rawBase64,
                mime: resolvedMime,
            },
        }
    }

    const normalized = normalizeImagePayload(trimmed)
    if (!normalized) {
        return { ok: false, reason: "invalid_base64_payload" }
    }

    return { ok: true, data: normalized }
}
