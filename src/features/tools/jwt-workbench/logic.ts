import type { JwtAlg } from "./types"
import { base64UrlToJson, bytesToBase64Url, jsonToBase64Url } from "@/core/jwt/base64url"

export function encodeJsonSegment(value: unknown): string {
    return jsonToBase64Url(value)
}

export function decodeJsonSegment<T = Record<string, unknown>>(segment: string): T {
    return base64UrlToJson<T>(segment)
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
