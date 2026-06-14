export const PHASE4_LIMITS = {
    maxSamlRawInputBytes: 2 * 1024 * 1024,
    maxSamlDecodedXmlBytes: 1024 * 1024,
    maxAsn1RawInputBytes: 1024 * 1024,
    maxAsn1DecodedBytes: 512 * 1024,
    maxHexBytesRawInputBytes: 512 * 1024,
    maxHexBytesRows: 512,
    maxUnicodeInputBytes: 256 * 1024,
    maxUnicodeCharacters: 5000,
    maxUnicodeRenderedCharacters: 1000,
} as const

export function measureUtf8Bytes(value: string, maxBytes = Number.POSITIVE_INFINITY): { bytes: number; exceeded: boolean } {
    let bytes = 0
    for (let index = 0; index < value.length; index += 1) {
        const codePoint = value.codePointAt(index) ?? 0
        if (codePoint > 0xffff) index += 1
        bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4
        if (bytes > maxBytes) return { bytes, exceeded: true }
    }
    return { bytes, exceeded: false }
}

export function estimateBase64DecodedBytes(value: string): number {
    const compact = value.trim().replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/")
    if (!compact) return 0
    const padding = compact.endsWith("==") ? 2 : compact.endsWith("=") ? 1 : 0
    return Math.max(0, Math.floor((compact.length * 3) / 4) - padding)
}
