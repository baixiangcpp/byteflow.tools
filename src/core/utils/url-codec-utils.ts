export type UrlEncodingMode = "component" | "full" | "reserved"

const RESERVED_CHARS = ":/?#[]@!$&'()*+,;="
const HEX_DIGIT_PATTERN = /^[0-9a-fA-F]$/

export type MalformedPercentSequence = {
    index: number
    sequence: string
    reason: "truncated" | "non_hex" | "invalid_encoding"
}

export type UrlDecodeResult =
    | { ok: true; output: string }
    | { ok: false; error: MalformedPercentSequence }

export function encodeUrlByMode(input: string, mode: UrlEncodingMode): string {
    if (mode === "component") {
        return encodeURIComponent(input)
    }

    if (mode === "full") {
        return encodeURI(input)
    }

    let output = ""
    for (const char of input) {
        if (RESERVED_CHARS.includes(char)) {
            output += char
            continue
        }
        output += encodeURIComponent(char)
    }
    return output
}

export function decodeUrlByMode(input: string, mode: UrlEncodingMode): string {
    if (mode === "full") {
        return decodeURI(input)
    }
    return decodeURIComponent(input)
}

export function findMalformedPercentSequence(input: string): MalformedPercentSequence | null {
    for (let index = 0; index < input.length; index += 1) {
        if (input[index] !== "%") continue
        const sequence = input.slice(index, Math.min(index + 3, input.length))
        if (index + 2 >= input.length) {
            return { index, sequence, reason: "truncated" }
        }
        if (!HEX_DIGIT_PATTERN.test(input[index + 1]) || !HEX_DIGIT_PATTERN.test(input[index + 2])) {
            return { index, sequence: input.slice(index, index + 3), reason: "non_hex" }
        }
    }
    return null
}

export function decodeUrlByModeSafe(input: string, mode: UrlEncodingMode): UrlDecodeResult {
    const malformed = findMalformedPercentSequence(input)
    if (malformed) return { ok: false, error: malformed }
    try {
        return { ok: true, output: decodeUrlByMode(input, mode) }
    } catch {
        const firstPercentIndex = input.indexOf("%")
        return {
            ok: false,
            error: {
                index: Math.max(firstPercentIndex, 0),
                sequence: firstPercentIndex >= 0 ? input.slice(firstPercentIndex, firstPercentIndex + 3) : "",
                reason: "invalid_encoding",
            },
        }
    }
}
