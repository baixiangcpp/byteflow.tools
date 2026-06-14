const ENCODE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
    "`": "&#96;",
}

const NAMED_DECODE_MAP: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    "#39": "'",
    "#96": "`",
}

export function encodeHtmlEntities(input: string): string {
    if (!input) return ""
    return input.replace(/[&<>"'`]/g, (char) => ENCODE_MAP[char] ?? char)
}

export function decodeHtmlEntities(input: string): string {
    if (!input) return ""

    return input.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, rawEntity: string) => {
        const entity = rawEntity.toLowerCase()
        const named = NAMED_DECODE_MAP[entity]
        if (named !== undefined) return named

        if (entity.startsWith("#x")) {
            const codePoint = Number.parseInt(entity.slice(2), 16)
            if (!Number.isNaN(codePoint)) {
                return String.fromCodePoint(codePoint)
            }
            return match
        }

        if (entity.startsWith("#")) {
            const codePoint = Number.parseInt(entity.slice(1), 10)
            if (!Number.isNaN(codePoint)) {
                return String.fromCodePoint(codePoint)
            }
            return match
        }

        return match
    })
}
