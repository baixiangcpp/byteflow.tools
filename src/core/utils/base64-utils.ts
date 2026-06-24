const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function bytesToBinary(bytes: Uint8Array): string {
    let binary = ""
    const chunkSize = 0x8000
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
    }
    return binary
}

function binaryToBytes(binary: string): Uint8Array {
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
    }
    return bytes
}

export function toUrlSafeBase64(base64: string): string {
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

export function fromUrlSafeBase64(value: string): string {
    validateUrlSafeBase64Input(value)
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const padding = normalized.length % 4
    if (padding === 0) return normalized
    if (padding === 1) throw new Error("INVALID_BASE64URL_LENGTH")
    return normalized + "=".repeat(4 - padding)
}

export function validateUrlSafeBase64Input(value: string): void {
    if (/\s/.test(value)) {
        throw new Error("INVALID_BASE64URL_WHITESPACE")
    }

    const hasStandardAlphabet = /[+/]/.test(value)
    const hasUrlSafeAlphabet = /[-_]/.test(value)
    if (hasStandardAlphabet && hasUrlSafeAlphabet) {
        throw new Error("MIXED_BASE64_ALPHABET")
    }

    if (hasStandardAlphabet || !/^[A-Za-z0-9\-_]*={0,2}$/.test(value) || /=.*[^=]/.test(value)) {
        throw new Error("INVALID_BASE64URL_CHARACTERS")
    }

    const unpaddedLength = value.replace(/=+$/g, "").length
    if (unpaddedLength % 4 === 1) {
        throw new Error("INVALID_BASE64URL_LENGTH")
    }
}

export function encodeBytesToBase64(bytes: Uint8Array, urlSafe = false): string {
    const base64 = btoa(bytesToBinary(bytes))
    return urlSafe ? toUrlSafeBase64(base64) : base64
}

export function decodeBase64ToBytes(value: string, urlSafe = false): Uint8Array {
    const source = urlSafe ? fromUrlSafeBase64(value) : value
    return binaryToBytes(atob(source))
}

export function encodeTextToBase64(value: string, urlSafe = false): string {
    return encodeBytesToBase64(textEncoder.encode(value), urlSafe)
}

export function decodeBase64ToText(value: string, urlSafe = false): string {
    return textDecoder.decode(decodeBase64ToBytes(value, urlSafe))
}
