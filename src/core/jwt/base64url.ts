const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/

export function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = ""
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export function base64UrlToBytes(input: string): Uint8Array {
    if (!BASE64URL_PATTERN.test(input) || input.length % 4 === 1) {
        throw new Error("invalid_base64url")
    }

    const base64 = input
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(input.length / 4) * 4, "=")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

export function textToBase64Url(value: string): string {
    return bytesToBase64Url(new TextEncoder().encode(value))
}

export function base64UrlToText(input: string): string {
    return new TextDecoder().decode(base64UrlToBytes(input))
}

export function jsonToBase64Url(value: unknown): string {
    return textToBase64Url(JSON.stringify(value))
}

export function base64UrlToJson<T = unknown>(input: string): T {
    return JSON.parse(base64UrlToText(input)) as T
}
