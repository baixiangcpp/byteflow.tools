export type JwtJsonObject = Record<string, unknown>

export type JwtDecodeErrorCode =
    | "segment_count"
    | "empty_segment"
    | "invalid_base64url"
    | "invalid_json"
    | "decode_failed"

export type JwtClaimName = "exp" | "nbf" | "iat" | "iss" | "aud"

export type JwtClaimSemantic = {
    claim: JwtClaimName
    status: "valid" | "warning" | "info" | "invalid"
    detail:
        | "expires_in_future"
        | "expired"
        | "active"
        | "not_yet_valid"
        | "issued_at"
        | "issued_in_future"
        | "present"
        | "invalid_timestamp"
    utc?: string
    epochSeconds?: number
    valueSummary?: string
}

export type JwtSemanticSummary = {
    algorithm: string
    algNone: boolean
    warnings: Array<"alg_none" | "expired" | "not_yet_valid" | "issued_in_future">
    claims: JwtClaimSemantic[]
}

export type JwtDecodeResult = {
    header: JwtJsonObject
    payload: JwtJsonObject
    semantics: JwtSemanticSummary
}

const BASE64URL_PATTERN = /^[A-Za-z0-9_-]*$/
const TIMESTAMP_MIN_SECONDS = 0
const TIMESTAMP_MAX_SECONDS = 253_402_300_799

export class JwtDecodeError extends Error {
    readonly code: JwtDecodeErrorCode

    constructor(code: JwtDecodeErrorCode) {
        super(code)
        this.name = "JwtDecodeError"
        this.code = code
    }
}

function isJsonObject(value: unknown): value is JwtJsonObject {
    return typeof value === "object" && value !== null && !Array.isArray(value)
}

function decodeBase64UrlText(segment: string): string {
    if (!segment || !BASE64URL_PATTERN.test(segment) || segment.length % 4 === 1) {
        throw new JwtDecodeError("invalid_base64url")
    }

    const base64 = segment
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(segment.length / 4) * 4, "=")

    try {
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index)
        }
        return new TextDecoder().decode(bytes)
    } catch {
        throw new JwtDecodeError("invalid_base64url")
    }
}

function decodeJsonSegment(segment: string): JwtJsonObject {
    let parsed: unknown
    try {
        parsed = JSON.parse(decodeBase64UrlText(segment))
    } catch (error) {
        if (error instanceof JwtDecodeError) throw error
        throw new JwtDecodeError("invalid_json")
    }

    if (!isJsonObject(parsed)) {
        throw new JwtDecodeError("invalid_json")
    }
    return parsed
}

function parseTimestampSeconds(value: unknown): { ok: true; seconds: number; utc: string } | { ok: false } {
    if (typeof value === "boolean" || value === null || Array.isArray(value) || typeof value === "object") {
        return { ok: false }
    }

    const seconds = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(seconds) || seconds < TIMESTAMP_MIN_SECONDS || seconds > TIMESTAMP_MAX_SECONDS) {
        return { ok: false }
    }

    const date = new Date(seconds * 1000)
    if (Number.isNaN(date.getTime())) {
        return { ok: false }
    }

    return { ok: true, seconds, utc: date.toISOString() }
}

function summarizeClaimValue(value: unknown): string {
    if (Array.isArray(value)) return `array:${value.length}`
    if (value === null) return "null"
    return typeof value
}

function addTimestampClaim(
    claims: JwtClaimSemantic[],
    warnings: JwtSemanticSummary["warnings"],
    claim: "exp" | "nbf" | "iat",
    value: unknown,
    nowSeconds: number,
): void {
    const parsed = parseTimestampSeconds(value)
    if (!parsed.ok) {
        claims.push({ claim, status: "invalid", detail: "invalid_timestamp" })
        return
    }

    if (claim === "exp") {
        const expired = parsed.seconds <= nowSeconds
        if (expired) warnings.push("expired")
        claims.push({
            claim,
            status: expired ? "warning" : "valid",
            detail: expired ? "expired" : "expires_in_future",
            utc: parsed.utc,
            epochSeconds: parsed.seconds,
        })
        return
    }

    if (claim === "nbf") {
        const future = parsed.seconds > nowSeconds
        if (future) warnings.push("not_yet_valid")
        claims.push({
            claim,
            status: future ? "warning" : "valid",
            detail: future ? "not_yet_valid" : "active",
            utc: parsed.utc,
            epochSeconds: parsed.seconds,
        })
        return
    }

    const future = parsed.seconds > nowSeconds
    if (future) warnings.push("issued_in_future")
    claims.push({
        claim,
        status: future ? "warning" : "info",
        detail: future ? "issued_in_future" : "issued_at",
        utc: parsed.utc,
        epochSeconds: parsed.seconds,
    })
}

export function analyzeJwtSemantics(
    header: JwtJsonObject,
    payload: JwtJsonObject,
    now = new Date(),
): JwtSemanticSummary {
    const algorithm = typeof header.alg === "string" ? header.alg : "unknown"
    const warnings: JwtSemanticSummary["warnings"] = []
    const claims: JwtClaimSemantic[] = []
    const nowSeconds = Math.floor(now.getTime() / 1000)
    const algNone = algorithm.toLowerCase() === "none"

    if (algNone) warnings.push("alg_none")

    if (payload.exp !== undefined) addTimestampClaim(claims, warnings, "exp", payload.exp, nowSeconds)
    if (payload.nbf !== undefined) addTimestampClaim(claims, warnings, "nbf", payload.nbf, nowSeconds)
    if (payload.iat !== undefined) addTimestampClaim(claims, warnings, "iat", payload.iat, nowSeconds)
    if (payload.iss !== undefined) {
        claims.push({ claim: "iss", status: "info", detail: "present", valueSummary: summarizeClaimValue(payload.iss) })
    }
    if (payload.aud !== undefined) {
        claims.push({ claim: "aud", status: "info", detail: "present", valueSummary: summarizeClaimValue(payload.aud) })
    }

    return {
        algorithm,
        algNone,
        warnings,
        claims,
    }
}

export function decodeJwtParts(token: string, now = new Date()): JwtDecodeResult {
    const parts = token.trim().split(".")
    if (parts.length !== 3) {
        throw new JwtDecodeError("segment_count")
    }
    if (!parts[0] || !parts[1]) {
        throw new JwtDecodeError("empty_segment")
    }

    const header = decodeJsonSegment(parts[0])
    const payload = decodeJsonSegment(parts[1])

    return {
        header,
        payload,
        semantics: analyzeJwtSemantics(header, payload, now),
    }
}
