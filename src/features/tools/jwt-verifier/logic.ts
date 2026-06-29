import { base64UrlToBytes, base64UrlToJson, bytesToBase64Url } from "@/core/jwt/base64url"

export type JwtClaimLabels = {
    exp: string
    nbf: string
    iat: string
    iss: string
    sub: string
    aud: string
}

export type SupportedHmacJwtAlgorithm = "HS256" | "HS384" | "HS512"

export type JwtSignatureVerificationResult =
    | { status: "valid"; algorithm: SupportedHmacJwtAlgorithm }
    | { status: "invalid"; algorithm: SupportedHmacJwtAlgorithm }
    | { status: "unsupported"; algorithm: string }
    | { status: "unsigned"; algorithm: "none" }

export type JwtClaimCheck = {
    label: string
    status: "valid" | "invalid" | "info"
    value: string
}

const MIN_UNIX_SECONDS = 0
const MAX_UNIX_SECONDS = 253_402_300_799 // 9999-12-31T23:59:59Z

export function base64UrlDecode(str: string): Uint8Array {
    return base64UrlToBytes(str)
}

export function base64UrlEncode(bytes: Uint8Array): string {
    return bytesToBase64Url(bytes)
}

export function decodePayload(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".")
        if (parts.length !== 3) return null
        return base64UrlToJson<Record<string, unknown>>(parts[1])
    } catch { return null }
}

export function decodeHeader(token: string): Record<string, unknown> | null {
    try {
        const parts = token.split(".")
        if (parts.length !== 3) return null
        return base64UrlToJson<Record<string, unknown>>(parts[0])
    } catch { return null }
}

function isSupportedHmacAlgorithm(algorithm: string): algorithm is SupportedHmacJwtAlgorithm {
    return algorithm === "HS256" || algorithm === "HS384" || algorithm === "HS512"
}

function hashForHmacAlgorithm(algorithm: SupportedHmacJwtAlgorithm): "SHA-256" | "SHA-384" | "SHA-512" {
    if (algorithm === "HS384") return "SHA-384"
    if (algorithm === "HS512") return "SHA-512"
    return "SHA-256"
}

export function normalizeJwtAlgorithm(algorithm: unknown): string {
    return typeof algorithm === "string" && algorithm.trim() ? algorithm : "non-string alg"
}

export function classifyJwtVerificationAlgorithm(algorithm: unknown): "hmac" | "unsupported" | "unsigned" {
    const normalizedAlgorithm = normalizeJwtAlgorithm(algorithm)
    if (normalizedAlgorithm.toLowerCase() === "none") return "unsigned"
    if (isSupportedHmacAlgorithm(normalizedAlgorithm)) return "hmac"
    return "unsupported"
}

async function verifyHmacJwt(token: string, secret: string, algorithm: SupportedHmacJwtAlgorithm): Promise<boolean> {
    const parts = token.split(".")
    if (parts.length !== 3) return false
    const signingInput = `${parts[0]}.${parts[1]}`
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: hashForHmacAlgorithm(algorithm) },
        false,
        ["sign"],
    )
    const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signingInput))
    return bytesToBase64Url(new Uint8Array(signature)) === parts[2]
}

export async function verifyJwtSignature(token: string, secret: string, algorithm: unknown): Promise<JwtSignatureVerificationResult | null> {
    const normalizedAlgorithm = normalizeJwtAlgorithm(algorithm)
    const classification = classifyJwtVerificationAlgorithm(normalizedAlgorithm)
    if (classification === "unsigned") return { status: "unsigned", algorithm: "none" }
    if (classification === "unsupported") return { status: "unsupported", algorithm: normalizedAlgorithm }
    if (!secret.trim()) return null
    if (!isSupportedHmacAlgorithm(normalizedAlgorithm)) return { status: "unsupported", algorithm: normalizedAlgorithm }

    const valid = await verifyHmacJwt(token, secret, normalizedAlgorithm)
    return { status: valid ? "valid" : "invalid", algorithm: normalizedAlgorithm }
}

export function parseUnixTimestampClaim(value: unknown): { ok: true; seconds: number; iso: string } | { ok: false; error: string } {
    if (typeof value === "boolean" || value === null || Array.isArray(value) || typeof value === "object") {
        return { ok: false, error: `invalid timestamp: ${String(value)}` }
    }

    const seconds = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(seconds)) {
        return { ok: false, error: `invalid timestamp: ${String(value)}` }
    }

    if (seconds < MIN_UNIX_SECONDS || seconds > MAX_UNIX_SECONDS) {
        return { ok: false, error: `timestamp out of range: ${String(value)}` }
    }

    const date = new Date(seconds * 1000)
    if (Number.isNaN(date.getTime())) {
        return { ok: false, error: `invalid timestamp: ${String(value)}` }
    }

    return { ok: true, seconds, iso: date.toISOString() }
}

function addTimestampClaimCheck(
    checks: JwtClaimCheck[],
    label: string,
    value: unknown,
    resolveStatus: (seconds: number) => JwtClaimCheck["status"],
): void {
    const parsed = parseUnixTimestampClaim(value)
    if (!parsed.ok) {
        checks.push({ label, status: "invalid", value: parsed.error })
        return
    }
    checks.push({ label, status: resolveStatus(parsed.seconds), value: parsed.iso })
}

export function checkClaims(payload: Record<string, unknown>, labels: JwtClaimLabels): JwtClaimCheck[] {
    const checks: JwtClaimCheck[] = []
    const now = Math.floor(Date.now() / 1000)

    if (payload.exp !== undefined) {
        addTimestampClaimCheck(checks, labels.exp, payload.exp, (seconds) => seconds > now ? "valid" : "invalid")
    }
    if (payload.nbf !== undefined) {
        addTimestampClaimCheck(checks, labels.nbf, payload.nbf, (seconds) => seconds <= now ? "valid" : "invalid")
    }
    if (payload.iat !== undefined) {
        addTimestampClaimCheck(checks, labels.iat, payload.iat, () => "info")
    }
    if (payload.iss !== undefined) {
        checks.push({ label: labels.iss, status: "info", value: String(payload.iss) })
    }
    if (payload.sub !== undefined) {
        checks.push({ label: labels.sub, status: "info", value: String(payload.sub) })
    }
    if (payload.aud !== undefined) {
        checks.push({ label: labels.aud, status: "info", value: String(payload.aud) })
    }
    return checks
}
