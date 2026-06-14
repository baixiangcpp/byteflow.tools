import type { JwtAlg } from "./types"

function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = ""
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(input: string): Uint8Array {
    const base64 = input
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(input.length / 4) * 4, "=")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

export function encodeJsonSegment(value: unknown): string {
    return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(value)))
}

export function decodeJsonSegment<T = Record<string, unknown>>(segment: string): T {
    const bytes = base64UrlToBytes(segment)
    const text = new TextDecoder().decode(bytes)
    return JSON.parse(text) as T
}

export async function signHmac(signingInput: string, secret: string, algorithm: JwtAlg): Promise<string> {
    const hashMap: Record<JwtAlg, "SHA-256" | "SHA-384" | "SHA-512"> = {
        HS256: "SHA-256",
        HS384: "SHA-384",
        HS512: "SHA-512",
    }

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: hashMap[algorithm] },
        false,
        ["sign"],
    )
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
    return bytesToBase64Url(new Uint8Array(signatureBuffer))
}

export function safeJsonStringify(value: unknown): string {
    return JSON.stringify(value, null, 2)
}
