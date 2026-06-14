export type UrlEncodingMode = "component" | "full" | "reserved"

const RESERVED_CHARS = ":/?#[]@!$&'()*+,;="

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
