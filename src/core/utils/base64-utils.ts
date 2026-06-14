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
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    const padding = normalized.length % 4
    if (padding === 0) return normalized
    return normalized + "=".repeat(4 - padding)
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
